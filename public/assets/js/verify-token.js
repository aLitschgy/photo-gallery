(async function () {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    const res = await fetch('/api/check-token', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.status !== 200) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
})();