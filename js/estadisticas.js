import { estadisticasPorGenero } from "./api.js";

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
            linea("nota", `★ ${g.notaMedia}`)
        );
        return tarjeta;
    }));
}

async function cargar(minimo) {
    mostrarMensaje("...Cargando");
    mostrarDetalles([]);
    $("#resultados").replaceChildren();
    try {
        const generos = await estadisticasPorGenero(minimo);
        if (generos.length === 0) {
            mostrarMensaje("No hay géneros que cumplan el filtro.");
            return;
        }
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

cargar();
