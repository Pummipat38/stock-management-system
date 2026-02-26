const { execSync } = require('child_process');

function runCommand(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    return e.stdout || e.message || '';
  }
}

function getLocalCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (e) {
    return null;
  }
}

function getRemoteCommit() {
  try {
    execSync('git fetch origin --quiet', { stdio: 'pipe' });
    return execSync('git rev-parse --short origin/main', { encoding: 'utf8' }).trim();
  } catch (e) {
    return null;
  }
}

async function checkVercelDeploy(targetCommit) {
  // ใช้ vercel CLI เพื่อเช็ค deployment ที่ตรงกับ commit
  const result = runCommand(
    `npx vercel ls --yes 2>&1 | findstr "${targetCommit}"`,
    'd:\\stock-management-system'
  );
  
  if (result.includes(targetCommit) && result.includes('Ready')) {
    return { success: true, commit: targetCommit, status: 'Ready' };
  }
  
  if (result.includes(targetCommit) && (result.includes('Error') || result.includes('FAILED'))) {
    return { success: false, commit: targetCommit, status: 'Error' };
  }
  
  return { success: false, commit: targetCommit, status: 'Building' };
}

async function waitForDeploy(targetCommit) {
  console.log(`🎯 รอ deploy commit: ${targetCommit}`);
  console.log('⏳ กำลังตรวจสอบ Vercel...\n');
  
  let attempts = 0;
  const maxAttempts = 36; // 6 นาที
  
  while (attempts < maxAttempts) {
    const check = await checkVercelDeploy(targetCommit);
    
    if (check.success) {
      console.log(`\n✅ Deploy สำเร็จ! Commit ${targetCommit} พร้อมใช้งาน`);
      console.log(`🌐 https://stock-management-system.vercel.app`);
      return true;
    }
    
    if (check.status === 'Error') {
      console.log(`\n❌ Deploy ล้มเหลวสำหรับ commit ${targetCommit}`);
      return false;
    }
    
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 10000));
    attempts++;
  }
  
  console.log(`\n\n⚠️ หมดเวลารอ (6 นาที)`);
  console.log(`💡 Commit ${targetCommit} อาจยังไม่ถูก deploy`);
  console.log('📋 ตรวจสอบที่: https://vercel.com/dashboard');
  return false;
}

async function main() {
  console.log('🚀 Auto Deploy & Check\n');
  
  // 1. Get local commit before push
  const localCommit = getLocalCommit();
  console.log(`📌 Local: ${localCommit}`);
  
  // 2. Push to Git
  console.log('\n📤 Pushing...');
  try {
    runCommand('git add -A', 'd:\\stock-management-system');
    try {
      runCommand('git commit -m "auto: update"', 'd:\\stock-management-system');
    } catch (e) {}
    runCommand('git push origin main', 'd:\\stock-management-system');
    console.log('✅ Pushed');
  } catch (e) {
    console.log('❌ Push failed:', e.message);
    return false;
  }
  
  // 3. Get commit after push
  const pushedCommit = getLocalCommit();
  console.log(`📤 Commit: ${pushedCommit}\n`);
  
  // 4. Wait for this specific commit to deploy
  return await waitForDeploy(pushedCommit);
}

main().then(success => {
  process.exit(success ? 0 : 1);
});
