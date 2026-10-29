const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const reportsDir = path.join(__dirname, "..", "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Intercept stdout to capture Mocha's JSON reporter output
  let stdoutData = "";
  const originalWrite = process.stdout.write.bind(process.stdout);
  
  process.stdout.write = (chunk, encoding, callback) => {
    stdoutData += chunk.toString();
    // Also display in terminal for user visibility
    return originalWrite(chunk, encoding, callback);
  };

  // Configure Hardhat mocha runner to use JSON reporter
  hre.config.mocha = {
    ...hre.config.mocha,
    reporter: "json",
  };

  let exitCode = 0;
  try {
    exitCode = await hre.run("test");
  } catch (error) {
    exitCode = 1;
  } finally {
    process.stdout.write = originalWrite;
  }

  // Extract JSON output from Mocha
  let mochaReport = { stats: { passes: 0, failures: 0, tests: 0 }, passes: [], failures: [] };
  try {
    const jsonStart = stdoutData.indexOf("{");
    const jsonEnd = stdoutData.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonString = stdoutData.substring(jsonStart, jsonEnd + 1);
      mochaReport = JSON.parse(jsonString);
    }
  } catch (parseError) {
    console.error("Warning: Could not parse Mocha JSON output:", parseError.message);
  }

  // Gather metadata
  const hardhatPkg = require("hardhat/package.json");
  const testFiles = Array.from(
    new Set([
      ...mochaReport.passes.map((t) => path.basename(t.file || "")),
      ...mochaReport.failures.map((t) => path.basename(t.file || "")),
    ].filter(Boolean))
  );

  const passingCount = mochaReport.stats.passes || 0;
  const failingCount = mochaReport.stats.failures || 0;
  const totalCount = mochaReport.stats.tests || (passingCount + failingCount);
  const status = exitCode === 0 && failingCount === 0 ? "PASSED" : "FAILED";

  const failureDetails = (mochaReport.failures || []).map((f) => ({
    title: f.title,
    fullTitle: f.fullTitle,
    file: f.file ? path.basename(f.file) : "unknown",
    error: f.err ? f.err.message : "Unknown error",
    stack: f.err ? f.err.stack : null,
  }));

  const reportData = {
    projectTitle: "Workshop Credit Management System",
    executionTimestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      npmVersion: process.env.npm_config_user_agent || "N/A",
      hardhatVersion: hardhatPkg.version,
      solidityCompilerVersion: "0.8.24",
    },
    testFilesExecuted: testFiles,
    summary: {
      totalTests: totalCount,
      passingTests: passingCount,
      failingTests: failingCount,
      durationMs: mochaReport.stats.duration || 0,
      status: status,
      exitCode: exitCode,
    },
    failureDetails: failureDetails,
    passedTests: (mochaReport.passes || []).map((p) => ({
      title: p.title,
      suite: p.fullTitle,
      file: p.file ? path.basename(p.file) : "unknown",
      durationMs: p.duration,
    })),
  };

  // Write JSON report
  const jsonReportPath = path.join(reportsDir, "test-report.json");
  fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2), "utf8");

  // Write Markdown summary report
  const mdReportPath = path.join(reportsDir, "test-report.md");
  const mdContent = `# Test Execution Report: ${reportData.projectTitle}

- **Execution Date & Time:** ${reportData.executionTimestamp}
- **Overall Status:** **${reportData.summary.status}** (Exit Code: ${reportData.summary.exitCode})

## Environment Details
- **Node.js:** \`${reportData.environment.nodeVersion}\`
- **Hardhat:** \`${reportData.environment.hardhatVersion}\`
- **Solidity Compiler:** \`${reportData.environment.solidityCompilerVersion}\`

## Test Execution Summary
| Metric | Value |
|---|---|
| **Total Tests** | ${reportData.summary.totalTests} |
| **Passing Tests** | ${reportData.summary.passingTests} |
| **Failing Tests** | ${reportData.summary.failingTests} |
| **Duration** | ${reportData.summary.durationMs} ms |
| **Status** | ${reportData.summary.status} |

## Executed Test Suites
${reportData.testFilesExecuted.map((file) => `- \`${file}\``).join("\n")}

## Detailed Test Results
${reportData.passedTests.map((t) => `- [x] **${t.title}** (${t.file}) - ${t.durationMs}ms`).join("\n")}

${
  reportData.failureDetails.length > 0
    ? `## Failures\n` +
      reportData.failureDetails
        .map(
          (f) => `### ❌ ${f.title}\n- **File:** \`${f.file}\`\n- **Error:** ${f.error}\n`
        )
        .join("\n")
    : `## Failures\n- *None. All tests passed.*`
}
`;
  fs.writeFileSync(mdReportPath, mdContent, "utf8");

  console.log("\n==================================================");
  console.log("             AUTOMATED TEST REPORT                ");
  console.log("==================================================");
  console.log(`Status:         ${status}`);
  console.log(`Total Tests:    ${totalCount}`);
  console.log(`Passing:        ${passingCount}`);
  console.log(`Failing:        ${failingCount}`);
  console.log(`JSON Report:    ${jsonReportPath}`);
  console.log(`MD Report:      ${mdReportPath}`);
  console.log("==================================================");

  process.exit(exitCode);
}

main().catch((err) => {
  console.error("Failed to generate test report:", err);
  process.exit(1);
});
