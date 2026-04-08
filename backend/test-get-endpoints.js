async function test() {
    try {
        const token = process.argv[2];
        console.log("Fetching workouts...");
        const wRes = await fetch('http://localhost:5000/api/workouts', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        console.log("Workouts status:", wRes.status);
        console.log("Workouts data:", await wRes.text());

        console.log("Fetching progress...");
        const pRes = await fetch('http://localhost:5000/api/progress', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        console.log("Progress status:", pRes.status);
        console.log("Progress data:", await pRes.text());
        
    } catch(e) {
        console.error("Test script error:", e);
    }
}
test();
