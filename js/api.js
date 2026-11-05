import { API_URL } from "./config.js";

async function pedir(ruta, opciones = {}) {
    const cabecera = {};
    const token = localStorage.getItem("token");
    if (token) cabecera.Authorization = `Bearer ${token}`;
    if (opciones.body) cabecera["Content-Type"] = "application/json";

    const res = await fetch(`${API_URL}${ruta}`, {...opciones, headers: cabecera});
    const datos = res.status === 204 ? null : await res.json();
    if (!res.ok){
        const err = new Error(datos?.error || `Error ${res.status}`);
        err.detalles = Array.isArray(datos?.detalles) ? datos.detalles : [];
        throw err;
    }
    return datos;
}

export function estadisticasPorGenero(minimo) {
    const hayValor = minimo !== undefined && minimo !== null && minimo !== "";
    const query = hayValor ? `?${new URLSearchParams({ minimo })}` : "";
    return pedir(`/peliculas/estadisticas${query}`);
}

export function listarPeliculas(parametros) {
    const query = new URLSearchParams(parametros);
    return pedir(`/peliculas?${query}`);
}

export function resenasDe(peliculaId) {
    return pedir(`/peliculas/${peliculaId}/resenas`);
}

export function escribirResena(peliculaId, texto, estrellas) {
    const cuerpoRespuesta = { texto, estrellas }
    return pedir(`/peliculas/${peliculaId}/resenas`, { 
        method: "POST", 
        body: JSON.stringify(cuerpoRespuesta)
    })
}

export async function login(email, password) {
    const datos = await pedir("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });

    if(!datos) {
        throw new Error("Usuario y contraseña incorrectos");
    }

    localStorage.setItem("token", datos.token);
    localStorage.setItem("usuario", JSON.stringify(datos.usuario));

    return datos.usuario;
}

export function logout(){
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
}

export function usuarioActual() {
    return JSON.parse(localStorage.getItem("usuario"));
}

