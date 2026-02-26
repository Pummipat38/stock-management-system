const { execSync } = require('child_process');
const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;

function checkVercelDeployment() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: `/v6/deployments?projectId=${PROJECT_ID}&limit=1`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const latestDeploy = response.deployments?.[0];
          resolve(latestDeploy);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function waitForDeployment() {
  console.log('🔍 ตรวจสอบการ deploy บน Vercel...');
  
  let attempts = 0;
  const maxAttempts = 30; // 5 นาที
  
  while (attempts < maxAttempts) {
    try {
      const deploy = await checkVercelDeployment();
      
      if (!deploy) {
        console.log('⏳ รอการ deploy...');
        await new Promise(r => setTimeout(r, 10000));
        attempts++;
        continue;
      }
      
      const status = deploy.state;
      const url = deploy.url;
      
      if (status === 'READY') {
        console.log(`✅ Deploy สำเร็จ!`);
        console.log(`🌐 URL: https://${url}`);
        return true;
      } else if (status === 'ERROR') {
        console.log('❌ Deploy ล้มเหลว');
        return false;
      } else {
        console.log(`⏳ สถานะ: ${status}...`);
      }
      
      await new Promise(r => setTimeout(r, 10000));
      attempts++;
      
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาด:', error.message);
      return false;
    }
  }
  
  console.log('⚠️ หมดเวลารอการ deploy');
  return false;
}

async function main() {
  // Push โค้ด
  console.log('📤 กำลัง push ขึ้น Git...');
  try {
    execSync('git add -A', { stdio: 'inherit' });
    execSync('git commit -m "auto: update from script"', { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    console.log('✅ Push สำเร็จ\n');
  } catch (e) {
    console.log('⚠️ ไม่มีการเปลี่ยนแปลงหรือ push ล้มเหลว\n');
  }
  
  // รอและตรวจสอบการ deploy
  const success = await waitForDeployment();
  process.exit(success ? 0 : 1);
}

main();
