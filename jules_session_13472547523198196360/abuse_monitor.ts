
interface Env {
  D1: D1Database;
  SLACK_WEBHOOK_URL?: string;
}

interface ThreatSignature {
  ip: string;
  pattern: 'scraping' | 'injection' | 'enumeration';
  confidence: number;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log("Running Sentinel Anomaly Detection...");
    const threats = await detectAnomalies(env);
    
    for (const threat of threats) {
      console.log(`Threat Detected: ${JSON.stringify(threat)}`);
      
      // Log threat for ML retraining
      ctx.waitUntil(logThreat(threat, env));

      if (threat.confidence > 0.7) {
        ctx.waitUntil(banIP(threat.ip, env));
        ctx.waitUntil(alertSlack(`🚨 INSTANT IP BAN: ${threat.ip} (${threat.pattern})`, env));
      } else if (threat.confidence > 0.5) {
        ctx.waitUntil(alertSlack(`⚠️ SUSPICIOUS ACTIVITY: ${threat.ip} (${threat.pattern})`, env));
      }
    }

    // Systemic Health Check
    ctx.waitUntil(checkSystemicHealth(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/status') {
        const stats = await env.D1.prepare("SELECT COUNT(*) as total_queries FROM query_log").first();
        const bans = await env.D1.prepare("SELECT COUNT(*) as total_bans FROM banned_ips").first();
        return Response.json({ status: "Sentinel Active", stats, bans });
    }
    return new Response("Sentinel — Automated Curriculum Integrity & Threat Monitor");
  }
};

async function detectAnomalies(env: Env): Promise<ThreatSignature[]> {
  try {
    const recentQueries = await env.D1.prepare(`
      SELECT ip, COUNT(*) as freq 
      FROM query_log 
      WHERE timestamp > datetime('now', '-5 minutes')
      GROUP BY ip
      HAVING freq > 50
    `).all<{ip: string, freq: number}>();
    
    return recentQueries.results.map(r => ({
      ip: r.ip,
      pattern: r.freq > 100 ? 'scraping' : 'enumeration',
      confidence: Math.min(r.freq / 200, 1.0)
    }));
  } catch (e) {
    console.error("Failed to detect anomalies:", e);
    return [];
  }
}

async function banIP(ip: string, env: Env) {
  try {
    console.log(`Banning IP: ${ip}`);
    await env.D1.prepare("INSERT OR IGNORE INTO banned_ips (ip) VALUES (?)").bind(ip).run();
    // In real implementation, call Cloudflare API to block IP in WAF
  } catch (e) {
    console.error(`Failed to ban IP ${ip}:`, e);
  }
}

async function logThreat(threat: ThreatSignature, env: Env) {
  try {
    await env.D1.prepare("INSERT INTO threats (ip, pattern, confidence) VALUES (?, ?, ?)")
      .bind(threat.ip, threat.pattern, threat.confidence)
      .run();
  } catch (e) {
    console.error("Failed to log threat:", e);
  }
}

async function alertSlack(message: string, env: Env) {
  if (!env.SLACK_WEBHOOK_URL) {
    console.warn("Slack webhook not configured. Message:", message);
    return;
  }
  
  try {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({ text: message }),
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error("Failed to send Slack alert:", e);
  }
}

async function checkSystemicHealth(env: Env) {
  try {
    const totalQueries = await env.D1.prepare("SELECT COUNT(*) as count FROM query_log WHERE timestamp > datetime('now', '-10 minutes')").first<{count: number}>();
    if (totalQueries && totalQueries.count > 1000) {
       await env.D1.prepare("UPDATE config SET value = '0' WHERE key = 'api_enabled'").run();
       await alertSlack("🚨 EMERGENCY SHUTDOWN ACTIVATED due to systemic traffic spike.", env);
    }
  } catch (e) {
    console.error("Failed systemic health check:", e);
  }
}
