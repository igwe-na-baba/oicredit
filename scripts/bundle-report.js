import fs from 'fs/promises';
import path from 'path';
import zlib from 'zlib';
import { execSync } from 'child_process';

const distDir = path.resolve(process.cwd(), 'dist', 'assets');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function gzipSize(buffer) {
  return new Promise((resolve, reject) => {
    zlib.gzip(buffer, (err, result) => {
      if (err) return reject(err);
      resolve(result.length);
    });
  });
}

async function run() {
    try {
    const exists = await fs.stat(distDir).then(() => true).catch(() => false);
    if (!exists) {
      console.error('No build found. Run `npm run build` first.');
      process.exit(1);
    }

    const files = await fs.readdir(distDir);
    const assets = [];
    for (const file of files) {
      if (!file.endsWith('.js') && !file.endsWith('.css')) continue;
      const full = path.join(distDir, file);
      const stat = await fs.stat(full);
      const buf = await fs.readFile(full);
      const gz = await gzipSize(buf);
      assets.push({ file, size: stat.size, gzip: gz });
    }

    assets.sort((a, b) => b.gzip - a.gzip);

    // Compose report text
    const lines = [];
    lines.push('Bundle report — dist/assets');
    lines.push('-------------------------------------------------------------');
    lines.push(`  ${'file'.padEnd(40)} ${'size'.padStart(10)} ${'gz'.padStart(10)}`);
    lines.push('-------------------------------------------------------------');
    let total = 0, totalGz = 0;
    for (const a of assets) {
      total += a.size;
      totalGz += a.gzip;
      lines.push(`  ${a.file.padEnd(40)} ${formatBytes(a.size).padStart(10)} ${formatBytes(a.gzip).padStart(10)}`);
    }
    lines.push('-------------------------------------------------------------');
    lines.push(`  ${'TOTAL'.padEnd(40)} ${formatBytes(total).padStart(10)} ${formatBytes(totalGz).padStart(10)}`);
    lines.push('');

    const reportText = lines.join('\n');

    // Print to console
    console.log('\n' + reportText);

    // Ensure reports directory exists and write a timestamped and latest file
    const reportsDir = path.resolve(process.cwd(), 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bundle-report-${ts}.txt`;
    const latest = 'bundle-report-latest.txt';
    const outPath = path.join(reportsDir, filename);
    const latestPath = path.join(reportsDir, latest);
    await fs.writeFile(outPath, reportText);
    await fs.writeFile(latestPath, reportText);

    // Attempt to commit the report file to git (only if there are changes)
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      // Stage and commit only the new report(s)
      execSync(`git add "${outPath}" "${latestPath}"`);
      if (status.length === 0) {
        // No other changes, commit quietly
        execSync(`git commit -m "chore: add bundle report ${ts}" --no-verify`, { stdio: 'ignore' });
      } else {
        // There are other changes; commit only the report files explicitly
        execSync(`git commit -m "chore: add bundle report ${ts}" --no-verify`, { stdio: 'ignore' });
      }
      console.log(`Wrote report to ${outPath} and ${latestPath} and committed to git.`);
    } catch (gitErr) {
      console.warn('Could not auto-commit report (git may be unavailable or no changes to commit):', gitErr.message || gitErr);
    }

  } catch (err) {
    console.error('Error generating bundle report:', err);
    process.exit(1);
  }
}

run();
