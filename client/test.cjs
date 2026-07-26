const { chromium } = require('playwright');
const fs = require('fs');

const OUT_DIR = "C:\\Users\\Suryansh\\.gemini\\antigravity\\brain\\bed77996-ea79-40d3-9d4a-4ae27d7b2b92";

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();

    const networkLogs = [];

    page.on('request', request => {
      if (request.url().includes('/server/relational_action_log/acknowledge') && request.method() === 'POST') {
        networkLogs.push({ type: 'req', url: request.url(), postData: request.postData() });
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/server/relational_action_log/acknowledge') && response.request().method() === 'POST') {
        const body = await response.text();
        networkLogs.push({ type: 'res', url: response.url(), status: response.status(), body });
      }
    });

    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        fs.appendFileSync(`${OUT_DIR}\\console_logs.txt`, `[${msg.type()}] ${msg.text()}\n`);
      }
    });

    console.log("Navigating to http://localhost:3001...");
    await page.goto('http://localhost:3001');
    
    // Step A1: Hotspot Map (KA-BLR-URB)
    await page.waitForTimeout(3000); 
    await page.screenshot({ path: `${OUT_DIR}\\step_a1_hotspot_blr.png` });
    console.log("Captured Hotspot BLR");
    
    // Step A2: Switch to KA-KLB-NIP
    await page.selectOption('select:has(option[value="KA-KLB-NIP"])', 'KA-KLB-NIP');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${OUT_DIR}\\step_a2_hotspot_klb.png` });
    console.log("Captured Hotspot KLB");

    // Step B: Bias Audit Panel
    await page.click('#nav-bias-audit');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${OUT_DIR}\\step_b_bias_audit.png` });
    console.log("Captured Bias Audit");

    // Step C: Evidence Graph
    await page.click('#nav-network-graph');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${OUT_DIR}\\step_c_evidence_graph.png` });
    console.log("Captured Evidence Graph");

    // Step D: Click EDGE-EVID-01
    const edgeEvid = await page.$('#EDGE-EVID-01');
    if (edgeEvid) {
      await edgeEvid.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${OUT_DIR}\\step_d_click_edge.png` });
      console.log("Captured Edge click");
    } else {
      console.log("Could not find EDGE-EVID-01");
    }

    // Step E: Click Suggested Link
    // I know that the suggested links in the backend are usually at index 5 or 6 in the overall list
    let suggestedEdge = null;
    for (let i = 0; i < 10; i++) {
        suggestedEdge = await page.$(`#suggested-${i}`);
        if (suggestedEdge) break;
    }
    if (suggestedEdge) {
      await suggestedEdge.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${OUT_DIR}\\step_e_click_suggested.png` });
      console.log("Captured Suggested Link click");
    } else {
      console.log("Could not find any suggested link");
    }

    // Step F: Action Log Acknowledgment
    await page.click('#nav-action-logs');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Acknowledge Link")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Authorize Acknowledgment")');
    await page.waitForTimeout(3000); 

    await page.screenshot({ path: `${OUT_DIR}\\step_f_action_log_success.png` });
    console.log("Captured Action Log success");

    fs.writeFileSync(`${OUT_DIR}\\network_logs.json`, JSON.stringify(networkLogs, null, 2));
    console.log("Done.");
    await browser.close();
  } catch (err) {
    console.error("Test script failed:", err);
  }
})();
