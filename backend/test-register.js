async function test() {
    try {
        const res = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: "Test User",
                email: "test@example.com",
                password: "password123"
            })
        });
        const data = await res.json();
        console.log("Status:", res.status, "Data:", data);
    } catch(e) {
        console.error(e);
    }
}
test();
