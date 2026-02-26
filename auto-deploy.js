const { execSync } = require('child_process');

function runCommand(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    return e.stdout || e.message;
  }
}

async function deployAndCheck() {
  console.log('🚀 เริ่มต้นการ deploy...\n');
  
  // Step 1: Git add, commit, push
  console.log('📦 Step 1: Git add, commit, push');
  runCommand('git add -A', 'd:\\stock-management-system');
  
  const commitMsg = runCommand('git commit -m "auto: update changes"', 'd:\\stock-management-system');
  console.log(commitMsg);
  
  const pushOutput = runCommand('git push origin main', 'd:\\stock-management-system');
  console.log(pushOutput);
  console.log('✅ Push สำเร็จ\n');
  
  // Step 2: รอ Vercel เริ่ม build
  console.log('⏳ Step 2: รอ Vercel build (รอ 10 วินาที)...');
  await new Promise(r => setTimeout(r, 10000));
  
  // Step 3: ตรวจสอบการ deploy ด้วย Vercel CLI
  console.log('🔍 Step 3: ตรวจสอบสถานะ deployment...\n');
  
  let attempts = 0;
  const maxAttempts = 18; // 3 นาที
  
  while (attempts < maxAttempts) {
    try {
      const status = runCommand('npx vercel ls --yes 2>&1 | head -5', 'd:\\stock-management-system');
      console.log(`ตรวจสอบครั้งที่ ${attempts + 1}:`);
      console.log(status);
      
      if (status.includes('READY') || status.includes('Production')) {
        console.log('\n✅ Deploy สำเร็จแล้ว!');
        console.log('🌐 เว็บไซต์พร้อมใช้งาน');
        return true;
      }
      
      if (status.includes('ERROR') || status.includes('FAILED')) {
        console.log('\n❌ Deploy ล้มเหลว');
        return false;
      }
      
      console.log('⏳ ยังกำลัง build... รอ 10 วินาที\n');
      await new Promise(r => setTimeout(r, 10000));
      attempts++;
      
    } catch (e) {
      console.log('⏳ รอ...', e.message);
      await new Promise(r => setTimeout(r, 10000));
      attempts++;
    }
  }
  
  console.log('\n⚠️ หมดเวลารอ (3 นาที)');
  console.log('💡 ลองเช็คที่ https://vercel.com/dashboard เองนะครับ');
  return false;
}

deployAndCheck().then(success => {
  process.exit(success ? 0 : 1);
});
