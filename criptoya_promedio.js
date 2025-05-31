async function obtenerYPromediarPreciosCriptoYa(moneda, fiat, volumen) {
    // Asegurarse de que el volumen sea un número y sea positivo
    const volumenNumerico = parseFloat(volumen);
    if (isNaN(volumenNumerico) || volumenNumerico <= 0) {
        console.error("Volumen inválido. Debe ser un número positivo.");
        return null;
    }

    const apiUrl = `https://criptoya.com/api/${moneda.toUpperCase()}/${fiat.toUpperCase()}/${volumenNumerico}`;

    console.log(`Buscando datos para: ${moneda.toUpperCase()}/${fiat.toUpperCase()} con Volumen: ${volumenNumerico}`);
    console.log(`URL de la API: ${apiUrl}`);

    try {
        const respuesta = await fetch(apiUrl);

        console.log(`Estado HTTP: ${respuesta.status} ${respuesta.statusText}`);
        const textoRespuesta = await respuesta.text();
        console.log("--- Texto Crudo de la Respuesta ---");
        console.log(textoRespuesta.substring(0, 500));
        console.log("-----------------------------------");

        if (!respuesta.ok) {
            console.error("El servidor respondió con un estado no exitoso. Detalles de la respuesta:");
            try {
                const datosError = JSON.parse(textoRespuesta);
                console.error(datosError);
            } catch (e) {
                console.error("No se pudo analizar la respuesta de error como JSON. Texto crudo:", textoRespuesta);
            }
            throw new Error(`La llamada a la API falló con estado: ${respuesta.status} ${respuesta.statusText}`);
        }

        const datos = JSON.parse(textoRespuesta);

        let sumaTotalCompra = 0;
        let sumaTotalVenta = 0;
        let contadorCompra = 0;
        let contadorVenta = 0;
        let exchangesIncluidos = []; // Lista para almacenar los exchanges procesados
        let detallesExchanges = []; // Nueva lista para los detalles que se mostrarán

        console.log("\n--- Datos por Exchange (para Volumen " + volumenNumerico + ") ---");

        for (const nombreExchange in datos) {
            if (datos.hasOwnProperty(nombreExchange)) {
                // Omitir Paydecep2p
                if (nombreExchange.toLowerCase() === 'paydecep2p') {
                    console.log(`  Omitiendo datos de ${nombreExchange} según solicitud.`);
                    continue;
                }

                const datosExchange = datos[nombreExchange];

                if (typeof datosExchange === 'object' && datosExchange !== null) {
                    let tieneCompra = false;
                    let tieneVenta = false;
                    let totalCompraActual = 'N/A';
                    let totalVentaActual = 'N/A';

                    // Procesa 'totalAsk'
                    if (datosExchange.totalAsk && typeof datosExchange.totalAsk === 'number' && datosExchange.totalAsk > 0) {
                        sumaTotalCompra += datosExchange.totalAsk;
                        contadorCompra++;
                        tieneCompra = true;
                        totalCompraActual = datosExchange.totalAsk.toFixed(2);
                        console.log(`  ${nombreExchange}: Compra (Total ${volumenNumerico} ${moneda}): ${totalCompraActual} ${fiat}`);
                    } else if (datosExchange.ask && typeof datosExchange.ask === 'number' && datosExchange.ask > 0) {
                        const totalCompraCalculado = datosExchange.ask * volumenNumerico;
                        sumaTotalCompra += totalCompraCalculado;
                        contadorCompra++;
                        tieneCompra = true;
                        totalCompraActual = totalCompraCalculado.toFixed(2);
                        console.log(`  ${nombreExchange}: Compra (Unitario: ${datosExchange.ask.toFixed(2)}, Total Calculado: ${totalCompraCalculado.toFixed(2)}) ${fiat}`);
                    }

                    // Procesa 'totalBid'
                    if (datosExchange.totalBid && typeof datosExchange.totalBid === 'number' && datosExchange.totalBid > 0) {
                        sumaTotalVenta += datosExchange.totalBid;
                        contadorVenta++;
                        tieneVenta = true;
                        totalVentaActual = datosExchange.totalBid.toFixed(2);
                        console.log(`  ${nombreExchange}: Venta (Total ${volumenNumerico} ${moneda}): ${totalVentaActual} ${fiat}`);
                    } else if (datosExchange.bid && typeof datosExchange.bid === 'number' && datosExchange.bid > 0) {
                        const totalVentaCalculado = datosExchange.bid * volumenNumerico;
                        sumaTotalVenta += totalVentaCalculado;
                        contadorVenta++;
                        tieneVenta = true;
                        totalVentaActual = totalVentaCalculado.toFixed(2);
                        console.log(`  ${nombreExchange}: Venta (Unitario: ${datosExchange.bid.toFixed(2)}, Total Calculado: ${totalVentaCalculado.toFixed(2)}) ${fiat}`);
                    }

                    if (tieneCompra || tieneVenta) {
                        exchangesIncluidos.push(nombreExchange);
                        // Añadir detalles del exchange a la lista
                        detallesExchanges.push({
                            nombre: nombreExchange,
                            compra: totalCompraActual,
                            venta: totalVentaActual
                        });
                    }
                }
            }
        }

        console.log("\n--- Resumen de Cálculos ---");

        const promedioTotalCompra = contadorCompra > 0 ? sumaTotalCompra / contadorCompra : 'N/A';
        const promedioTotalVenta = contadorVenta > 0 ? sumaTotalVenta / contadorVenta : 'N/A';

        let promedioParalelo = 'N/A';
        if (typeof promedioTotalCompra === 'number' && typeof promedioTotalVenta === 'number') {
            promedioParalelo = (promedioTotalCompra + promedioTotalVenta) / 2;
        } else if (typeof promedioTotalCompra === 'number') {
            promedioParalelo = promedioTotalCompra;
        } else if (typeof promedioTotalVenta === 'number') {
            promedioParalelo = promedioTotalVenta;
        }

        console.log(`\n--- Promedios para ${moneda.toUpperCase()}/${fiat.toUpperCase()} para ${volumenNumerico} ${moneda.toUpperCase()} ---`);
        if (exchangesIncluidos.length > 0) {
            console.log(`Exchanges considerados (${exchangesIncluidos.length}): ${exchangesIncluidos.join(', ')}`);
        } else {
            console.log("No se encontraron datos válidos de exchanges para este volumen o par de monedas.");
        }

        console.log(`\nPromedio Total Compra (${volumenNumerico} ${moneda.toUpperCase()}): ${typeof promedioTotalCompra === 'number' ? promedioTotalCompra.toFixed(2) : promedioTotalCompra} ${fiat.toUpperCase()}`);
        console.log(`Promedio Total Venta (${volumenNumerico} ${moneda.toUpperCase()}): ${typeof promedioTotalVenta === 'number' ? promedioTotalVenta.toFixed(2) : promedioTotalVenta} ${fiat.toUpperCase()}`);
        console.log(`\nPromedio Paralelo: ${typeof promedioParalelo === 'number' ? promedioParalelo.toFixed(2) : promedioParalelo} ${fiat.toUpperCase()}`);

        return {
            promedioTotalCompra: promedioTotalCompra,
            promedioTotalVenta: promedioTotalVenta,
            promedioParalelo: promedioParalelo,
            cantidadExchanges: exchangesIncluidos.length,
            listaExchanges: exchangesIncluidos,
            // --- NUEVO: Devolver los detalles de cada exchange ---
            detallesExchanges: detallesExchanges,
            // --- FIN NUEVO ---
            monedaBase: moneda.toUpperCase(), // Para mostrar en el HTML
            fiatBase: fiat.toUpperCase(),      // Para mostrar en el HTML
            volumenSolicitado: volumenNumerico // Para mostrar en el HTML
        };

    } catch (error) {
        console.error("Ocurrió un error durante la llamada a la API o el procesamiento:", error);
        return null;
    }
}