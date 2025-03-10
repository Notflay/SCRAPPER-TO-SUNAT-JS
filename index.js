const axios = require('axios');
const cheerio = require('cheerio');
const tough = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const jar = new tough.CookieJar();
const session = wrapper(axios.create({ jar }));

async function consultarRuc(ruc) {
    const url = "https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/FrameCriterioBusquedaWeb.jsp";
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.62 Safari/537.36'
    };
											
    try {
        // Solicitud inicial
        let response = await session.get(url, { headers, timeout: 10000 });
        if (response.status !== 200) {
            return "Error al acceder a la página principal";
        }

        // 2 parte de la petición 
        const numeroDNI = "12345678";

        // Datos para la solicitud POST
        let data = new URLSearchParams({
            'accion': 'consPorTipdoc',
            'razSoc': '',
            'nroRuc': '',
            'nrodoc': '12345678',
            'contexto': 'ti-it',
            'modo': '1',
            'search1': '',
            'rbtnTipo': '2',
            'tipdoc': '1',
            'search2': numeroDNI,
            'search3': '',
            'codigo': ''
        });

		
        // URL para la solicitud POST
        const postUrl = "https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/jcrS00Alias";

        // Solicitud POST
        response = await session.post(postUrl, data, { headers, withCredentials: false });
        if (response.status !== 200) {
            return "Error al realizar la solicitud POST";
        }

        const html = response.data;
        let $ = cheerio.load(html);
        const numRndInput = $('input[name="numRnd"]');
        if (!numRndInput.length) {
            console.log(html); // Imprimir el contenido de la respuesta HTML
            return "Error al encontrar el campo numRnd";
        }

        const numRndValue = numRndInput.val();

        data = new URLSearchParams({
            'accion': 'consPorRuc',
            'actReturn': '1',
            'nroRuc': ruc,
            'numRnd': numRndValue,
            'modo': '1'
        });

        // Solicitud POST
        response = await session.post(postUrl, data, { headers, withCredentials: false });
        if (response.status !== 200) {
            return "Error al realizar la solicitud POST";
        }

        const finalHtml = response.data;
        $ = cheerio.load(finalHtml);

        // Extraer el valor del campo desRuc
        const desRucInput = $('input[name="desRuc"]');
        if (desRucInput.length) {
            const desRucValue = desRucInput.val();
            console.log(`Razón Social: ${desRucValue}`);
        } else {
            console.log("No se encontró el campo desRuc");
        }

        return "Solicitud POST realizada con éxito";
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

// Ejemplo de uso
const ruc = "20553031002";
consultarRuc(ruc).then(estadoRuc => console.log(estadoRuc));