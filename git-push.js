const { execSync } = require('child_process');
const path = require('path');

const projectPath = 'd:\\stock-management-system';

try {
  console.log('Checking git status...');
  const status = execSync('git status --short', { cwd: projectPath, encoding: 'utf8' });
  console.log('Status:', status || 'No changes');
  
  if (status.trim()) {
    console.log('Adding files...');
    execSync('git add -A', { cwd: projectPath });
    
    console.log('Committing...');
    execSync('git commit -m "feat: add left columns CUSTOMER MODEL PART NAME PART NO VOLUME YEAR MONTH"', { cwd: projectPath });
    
    console.log('Pushing...');
    execSync('git push origin main', { cwd: projectPath });
    
    console.log('Done!');
  } else {
    console.log('No changes to commit');
  }
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
