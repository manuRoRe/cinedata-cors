import { estadisticasPorGenero, listarPeliculas } from "./api.js";

const $ = selector => document.querySelector(selector);

function mostrarMensaje(texto, esError = false) {
    $("#estado").textContent = texto;
    $("#estado").classList.toggle("error", esError);
}

function mostrarDetalles(detalles = []) {
    const lista = $("#detalles");
    lista.replaceChildren(...detalles.map(d => {
        const li = document.createElement("li");
        li.textContent = d;
        return li;
    }));
    lista.hidden = detalles.length === 0;
}

function linea(clase, texto) {
    const p = document.createElement("p");
    if (clase) p.className = clase;
    p.textContent = texto;
    return p;
}

function pintar(generos) {
    $("#resultados").replaceChildren(...generos.map(g => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta";
        const titulo = document.createElement("h3");
        titulo.textContent = g.genero;
        tarjeta.append(
            titulo,
            linea("", `${g.total} ${g.total === 1 ? "película" : "películas"}`),
            linea("nota", `★ ${g.notaMedia}`),
            botonGenero(g.genero)
        );
        return tarjeta;
    }));
}

function botonGenero(genero) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-tarjeta";
    boton.dataset.genero = genero;
    boton.textContent = "Ver películas";
    boton.setAttribute("aria-label", `Ver películas de ${genero}`);
    return boton;
}

let generosActuales = [];
let botonOrigen = null;
let peticionGenero = 0;

function mostrarVistaTarjetas() {
    peticionGenero++;
    $("#vista-genero").hidden = true;
    $("#form-estadisticas").hidden = false;
    $("#resultados").hidden = false;
    $("#detalles").hidden = $("#detalles").children.length === 0;
}

function estadoGenero(texto, esError = false) {
    $("#genero-estado").textContent = texto;
    $("#genero-estado").classList.toggle("error", esError);
    $("#genero-estado").hidden = texto === "";
}

async function peliculasDelGenero(genero) {
    const base = { genero, limit: 50 };
    const primera = await listarPeliculas({ ...base, page: 1 });
    let peliculas = [...primera.datos];
    const MAX_PAGINAS = 20;
    const recibidas = Number(primera.paginacion?.paginas);
    const paginas = Number.isInteger(recibidas) && recibidas > 0 ? Math.min(recibidas, MAX_PAGINAS) : 1;
    if (paginas > 1) {
        const resto = await Promise.all(
            Array.from({ length: paginas - 1 }, (_, i) => listarPeliculas({ ...base, page: i + 2 }))
        );
        resto.forEach(r => peliculas.push(...r.datos));
    }
    return peliculas;
}

function tarjetaPelicula(p) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta";
    const titulo = document.createElement("h3");
    titulo.textContent = p.titulo;
    tarjeta.append(
        titulo,
        linea("", `${p.anio}`),
        linea("nota", `★ ${p.nota}`),
        linea("", `Dirección: ${p.director?.nombre ?? p.director ?? "—"}`)
    );
    return tarjeta;
}

async function abrirGenero(genero, boton) {
    const resumen = generosActuales.find(g => g.genero === genero);
    botonOrigen = boton;
    const mia = ++peticionGenero;

    $("#form-estadisticas").hidden = true;
    $("#resultados").hidden = true;
    $("#detalles").hidden = true;
    $("#vista-genero").hidden = false;

    $("#genero-titulo").textContent = genero;
    $("#genero-stats").textContent = resumen
        ? `${resumen.total} ${resumen.total === 1 ? "película" : "películas"} · ★ ${resumen.notaMedia}`
        : "";
    $("#genero-peliculas").replaceChildren();
    estadoGenero("...Cargando");
    $("#genero-titulo").focus();

    try {
        const peliculas = await peliculasDelGenero(genero);
        if (mia !== peticionGenero) return;
        if (peliculas.length === 0) {
            estadoGenero("No hay películas para este género.");
            return;
        }
        $("#genero-peliculas").replaceChildren(...peliculas.map(tarjetaPelicula));
        estadoGenero("");
    } catch (error) {
        if (mia !== peticionGenero) return;
        estadoGenero(error.message, true);
    }
}

function volver() {
    mostrarVistaTarjetas();
    if (botonOrigen?.isConnected) botonOrigen.focus();
}

async function cargar(minimo) {
    mostrarVistaTarjetas();
    mostrarMensaje("...Cargando");
    mostrarDetalles([]);
    $("#resultados").replaceChildren();
    try {
        const generos = await estadisticasPorGenero(minimo);
        if (generos.length === 0) {
            mostrarMensaje("No hay géneros que cumplan el filtro.");
            return;
        }
        generosActuales = generos;
        pintar(generos);
        mostrarMensaje(`${generos.length} ${generos.length === 1 ? "género" : "géneros"}`);
    } catch (error) {
        mostrarMensaje(error.message, true);
        mostrarDetalles(error.detalles);
    }
}

$("#form-estadisticas").addEventListener("submit", evento => {
    evento.preventDefault();
    cargar(new FormData(evento.target).get("minimo"));
});

$("#resultados").addEventListener("click", evento => {
    const boton = evento.target.closest("button[data-genero]");
    if (boton) abrirGenero(boton.dataset.genero, boton);
});

$("#volver").addEventListener("click", volver);

cargar();
