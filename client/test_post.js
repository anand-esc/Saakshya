fetch('http://localhost:3000/server/relational_action_log/acknowledge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    target_type: 'edge',
    target_id: 'EDGE-EVID-01',
    user_id: 'USER-0001',
    reason_code: 'verified'
  })
})
.then(res => res.json().then(data => ({status: res.status, body: data})))
.then(console.log)
.catch(console.error);
