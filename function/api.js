export async function fetchJSON(url, options = {}) {
    const headers = { Accept: 'application/json', ...options.headers }
    const reponse = await fetch(url, { ...options, headers })
    if (reponse.ok) {
        return reponse.json()
    }
    throw new Error('Erreur de serveur')
}