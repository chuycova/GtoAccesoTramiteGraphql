import { psql } from "../config/db-pg";



export const agregarSalidasyEntradas = async (arrayFechas: any) => {
    const arrayCom = await Promise.all(arrayFechas.map(async (e: any) => {
        const Total_Entradas = await totalEntradasxFecha(e.Fecha);
        const Total_Salidas = await totalSalidasxFecha(e.Fecha);
        const Total_Visitas = await totalRegistrosxFecha(e.Fecha);
        const Total_PreRegistros = await totalPreRegistrosxFecha(e.Fecha);
        const Total_Invitados_con_Entradas = await totalPersonasConEntradaxFecha(e.Fecha);
        const TotalReingresos = await totalReingresosxFecha(e.Fecha);
        const TotalAdentro = (Total_Entradas > 0) ? await getReingresosSitas(Total_Entradas, Total_Salidas) : 0;
        const TotalInvitados = await totalInvitadosxFecha(e.Fecha);

        return {
            ...e,
            Reingresos: TotalReingresos,
            Total_Entradas: parseInt(Total_Entradas),
            Total_Adentro: TotalAdentro,
            Total_Invitados: parseInt(TotalInvitados),
            Total_Salidas: parseInt(Total_Salidas),
            Total_Visitas: parseInt(Total_Visitas), // Registros
            Total_PreRegistro: parseInt(Total_PreRegistros), // Registros
        };
    }));
    return arrayCom;
}


const getReingresosSitas = (numUno: any, numDos: any) => Math.abs(numUno - numDos);


const totalRegistrosxFecha = async (fecha: any) => { // Registros
    let eventQuery = `SELECT count(s."Oid")as "Total_Visitas" from "Solicitud" s 
       WHERE s."FechaHoraVisita"::DATE = '${fecha}'::DATE AND "GCRecord" IS NULL AND s."Invitado" IS NOT NULL`;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Visitas;
}

const totalPreRegistrosxFecha = async (fecha: any) => { // Registros
    let eventQuery = `SELECT count(s."Oid")as "Total_PreRegistros" from "Solicitud" s 
        WHERE s."FechaHoraVisita"::DATE = '${fecha}'::DATE AND "GCRecord" IS null
            AND s."Invitado" IS NOT null and s."EsPreregistro" is true `;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_PreRegistros;
}

const totalInvitadosxFecha = async (fecha: any) => {
    let eventQuery = `SELECT count(distinct s."Invitado") as "Total_Invitados"  from "Solicitud" s 
    WHERE s."FechaHoraVisita"::DATE = '${fecha}'::DATE 
    AND s."Invitado" IS NOT NULL AND "GCRecord" IS null`;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Invitados;
}

const totalEntradasxFecha = async (fecha: any) => {
    let eventQuery = `SELECT count(distinct(hes."Solicitud"))as "Total_Entradas" from "HistorialEntradaSalida" hes 
                         WHERE "Tipo" = 1 AND hes."FechaHora"::DATE = '${fecha}'::DATE AND "GCRecord" IS NULL `;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Entradas;
}

const totalSalidasxFecha = async (fecha: any) => {
    let eventQuery = `SELECT COUNT(DISTINCT hes."Solicitud") AS "Total_Salidas"
    FROM "HistorialEntradaSalida" hes
    WHERE "Tipo" = 2
      AND hes."FechaHora"::DATE = '${fecha}'::DATE
      AND "GCRecord" IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM "HistorialEntradaSalida" hes_ant
        WHERE hes_ant."Tipo" = 2
          AND hes_ant."FechaHora"::DATE < ('${fecha}'::DATE ) 
          AND hes_ant."Solicitud" = hes."Solicitud"
          AND hes_ant."GCRecord" IS NULL
      );
    `;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Salidas;
}
const totalPersonasConEntradaxFecha = async (fecha: any) => {
    let eventQuery = ` SELECT COUNT(DISTINCT(hes_i."Oid")) AS "Total_Invitados_con_Entradas" FROM "HistorialEntradaSalida" hes 
      INNER JOIN "Solicitud" hes_s ON hes_s."Oid" = hes."Solicitud" AND hes_s."GCRecord" IS null 
      INNER JOIN "Invitado" hes_i ON hes_i."Oid" = hes_s."Invitado" AND hes_i."GCRecord" IS null 
      WHERE hes."Tipo" = 1 AND hes."FechaHora"::DATE >= '${fecha}' AND hes."FechaHora"::DATE <= '${fecha}' AND hes."GCRecord" IS NULL`;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Invitados_con_Entradas;
}

const totalReingresosxFecha = async (fecha: any) => {
    let eventQuery = `SELECT COUNT(*) AS "Total_Reincresos"
    FROM (
      SELECT s."Invitado", COUNT(*) AS "EntradasEnElMismoDia"
      FROM "Solicitud" s
      JOIN "HistorialEntradaSalida" hes ON hes."Solicitud" = s."Oid" 
      WHERE hes."Tipo" = 1 AND hes."GCRecord" IS NULL 
      AND hes."FechaHora"::DATE = '${fecha}' AND s."Invitado" IS NOT NULL
      GROUP BY s."Invitado", hes."FechaHora"::DATE
      HAVING COUNT(*) > 1
    ) AS subquery;
     `;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Reincresos;
}

export const generarFechasXRango = async (fecha: any, fecha2: any) => {
    let eventQuery = `SELECT  CASE 
          WHEN EXTRACT(DOW FROM dd) = 0 THEN 'Domingo'
          WHEN EXTRACT(DOW FROM dd) = 1 THEN 'Lunes'
          WHEN EXTRACT(DOW FROM dd) = 2 THEN 'Martes'
          WHEN EXTRACT(DOW FROM dd) = 3 THEN 'Miércoles'
          WHEN EXTRACT(DOW FROM dd) = 4 THEN 'Jueves'
          WHEN EXTRACT(DOW FROM dd) = 5 THEN 'Viernes'
          WHEN EXTRACT(DOW FROM dd) = 6 THEN 'Sábado'
        END AS "Dia",to_char(date_trunc('day', dd)::date,'dd-MM-yyyy') as "Fecha"
        FROM generate_series ( '${fecha}'::timestamp , '${fecha2}'::timestamp, '1 day'::interval) dd ORDER by "Fecha" desc`;
    let res = await psql.manyOrNone(eventQuery);
    return res;
}



export const getValuesPorFechas = async (fechaInicio: string, fechaFin: string) => {
    const Total_Entradas = parseInt(await totalEntradasXRangoFechas(fechaInicio, fechaFin));
    const Total_Salidas = parseInt(await totalSalidasXRangoFechas(fechaInicio, fechaFin));
    const Total_Visitas = parseInt(await totalRegistrosXRangoFecha(fechaInicio, fechaFin));
    const Total_Invitados = parseInt(await totalInvitadosXRangoFecha(fechaInicio, fechaFin));
    const Total_PreRegistros = parseInt(await totalPreRegistrosXRangoFecha(fechaInicio, fechaFin));
    // const Total_Invitados_con_Entradas = await totalInvitadosConEntradaXRangoFechas(fechaInicio, fechaFin);
    const Total_Adentro = (await getReingresosSitas(Total_Entradas, Total_Salidas));
    const Reingresos = parseInt(await totalReingresosxRangoFecha(fechaInicio, fechaFin));

    return [{
        Total_Invitados: isNaN(Total_Invitados)? 0 :Total_Invitados,
        Total_Visitas: isNaN(Total_Visitas)? 0 : Total_Visitas,
        Total_Entradas: isNaN(Total_Entradas)? 0 : Total_Entradas,
        Total_Salidas: isNaN(Total_Salidas)? 0 : Total_Salidas,
        Total_Adentro: isNaN(Total_Adentro)? 0 : Total_Adentro ,
        Reingresos: isNaN(Reingresos)? 0 : Reingresos ,
        Total_PreRegistros: isNaN(Total_PreRegistros) ? 0 : Total_PreRegistros
    }];
}

const totalPreRegistrosXRangoFecha = async (fechaInicio: any, fechaFin: any) => { // Registros
    let eventQuery = `SELECT count(s."Oid")as "Total_PreRegistros" from "Solicitud" s 
      WHERE  s."FechaHoraVisita"::DATE >= '${fechaInicio}' and s."FechaHoraVisita"::DATE <= '${fechaFin}' 
          AND "GCRecord" IS null AND s."Invitado" IS NOT null and s."EsPreregistro" is true `;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_PreRegistros;
}

const totalInvitadosXRangoFecha = async (fechaInicio: any, fechaFin: any) => {
    let eventQuery = `select
	sum ("Total_Invitados") as "Total_invitadosR"
	from (
	select count(distinct  s."Invitado") as "Total_Invitados" from "Solicitud" s
	WHERE s."FechaHoraVisita"::DATE >= '${fechaInicio}' and s."FechaHoraVisita"::DATE <= '${fechaFin}' 
  	AND s."Invitado" IS NOT NULL AND "GCRecord" IS null 
  	GROUP BY  s."FechaHoraVisita"::DATE
	)
	as Sunquery;`;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_invitadosR;
}

const totalRegistrosXRangoFecha = async (fechaInicio: any, fechaFin: any) => { // Registros
    let eventQuery = `SELECT count(s."Oid")as "Total_Visitas" from "Solicitud" s 
     WHERE s."FechaHoraVisita"::DATE >= '${fechaInicio}' and s."FechaHoraVisita"::DATE <= '${fechaFin}' 
     AND "GCRecord" IS NULL AND s."Invitado" IS NOT NULL`;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Visitas;
}

const totalReingresosxRangoFecha = async (fechaInicio: any, fechaFin: any) => {
    let eventQuery = `SELECT COUNT(*) AS "Total_Reincresos"
  FROM (
    SELECT s."Invitado", COUNT(*) AS "EntradasEnElMismoDia"
    FROM "Solicitud" s
    JOIN "HistorialEntradaSalida" hes ON hes."Solicitud" = s."Oid" 
    WHERE hes."Tipo" = 1 AND hes."GCRecord" IS NULL 
    AND  hes."FechaHora"::DATE >= '${fechaInicio}' AND hes."FechaHora"::DATE <= '${fechaFin}'  AND s."Invitado" IS NOT NULL
    GROUP BY s."Invitado", hes."FechaHora"::DATE
    HAVING COUNT(*) > 1
  ) AS subquery;
   `;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Reincresos;
}

const totalEntradasXRangoFechas = async (fechaInicio: any, fechaFin: any) => {
    let eventQuery = `SELECT COUNT(DISTINCT(hes."Solicitud")) as  "Total_Entradas" FROM "HistorialEntradaSalida" hes 
                      WHERE "Tipo" = 1 AND "FechaHora"::DATE >= '${fechaInicio}' and "FechaHora"::DATE <= '${fechaFin}' AND "GCRecord" IS NULL`;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Entradas;
}

const totalSalidasXRangoFechas = async (fechaInicio: any, fechaFin: any) => {
    let eventQuery = `SELECT COUNT(DISTINCT(hes."Solicitud")) as "Total_Salidas" FROM "HistorialEntradaSalida" hes 
                    WHERE "Tipo" = 2 AND "FechaHora"::DATE >= '${fechaInicio}' and "FechaHora"::DATE <= '${fechaFin}' AND "GCRecord" IS null`;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Salidas;
}

const totalInvitadosConEntradaXRangoFechas = async (fechaInicio: any, fechaFin: any) => {
    let eventQuery = `SELECT COUNT(DISTINCT(hes_i."Oid")) AS "Total_Invitados_con_Entradas" FROM "HistorialEntradaSalida" hes 
                    INNER JOIN "Solicitud" hes_s ON hes_s."Oid" = hes."Solicitud" AND hes_s."GCRecord" IS null 
                    INNER JOIN "Invitado" hes_i ON hes_i."Oid" = hes_s."Invitado" AND hes_i."GCRecord" IS null 
                    WHERE hes."Tipo" = 1 AND hes."FechaHora"::DATE >= '${fechaInicio}' AND hes."FechaHora"::DATE <= '${fechaFin}' 
                    AND hes."GCRecord" IS NULL`;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Invitados_con_Entradas;
}

export const generarMEsesXRangoFecha = async (fecha: any, fecha2: any) => {
    let eventQuery = `SELECT  
    CASE 
      WHEN EXTRACT(MONTH FROM MM) = 1 THEN 'Enero'
      WHEN EXTRACT(MONTH FROM MM) = 2 THEN 'Febrero'
      WHEN EXTRACT(MONTH FROM MM) = 3 THEN 'Marzo'
      WHEN EXTRACT(MONTH FROM MM) = 4 THEN 'Abril'
      WHEN EXTRACT(MONTH FROM MM) = 5 THEN 'Mayo'
      WHEN EXTRACT(MONTH FROM MM) = 6 THEN 'Junio'
      WHEN EXTRACT(MONTH FROM MM) = 7 THEN 'Julio'
      WHEN EXTRACT(MONTH FROM MM) = 8 THEN 'Agosto'
      WHEN EXTRACT(MONTH FROM MM) = 9 THEN 'Septiembre'
      WHEN EXTRACT(MONTH FROM MM) = 10 THEN 'Octubre'
      WHEN EXTRACT(MONTH FROM MM) = 11 THEN 'Noviembre'
      WHEN EXTRACT(MONTH FROM MM) = 12 THEN 'Diciembre' 
    END AS "NombreMes", 
    EXTRACT(MONTH FROM MM) AS "Mes"
  FROM generate_series('${fecha}'::timestamp, '${fecha2}'::timestamp, '1 month'::interval) MM 
  ORDER BY "Mes" asc ;`;
    let res = await psql.manyOrNone(eventQuery);
    return res;
}


export const agregarResultadosXMes = async (arrayFechas: any) => {
    const arrayCom = await Promise.all(arrayFechas.map(async (e: any) => {
        const Total_Entradas = await totalEntradasxMes(e.Mes);
        const Total_Salidas = await totalSalidasxMes(e.Mes);
        const Total_Visitas = await totalRegistrosxMEs(e.Mes);
        const Total_PreRegistros = await totalPreRegistrosxMes(e.Mes);
        //   const Total_Invitados_con_Entradas = await totalPersonasConEntradaxFecha(e.Mes); 
        const TotalReingresos = await totalReingresosxMES(e.Mes);
        const TotalAdentro = (Total_Entradas > 0) ? await getReingresosSitas(Total_Entradas, Total_Salidas) : 0;
        const TotalInvitados = await totalInvitadosxMes(e.Mes);

        return {
            ...e,
            Total_Invitados: parseInt(TotalInvitados),
            Total_Visitas: parseInt(Total_Visitas),
            Total_Entradas: parseInt(Total_Entradas),
            Total_Salidas: parseInt(Total_Salidas),
            Total_Adentro: TotalAdentro,
            Reingresos: parseInt(TotalReingresos),
            Total_PreRegistros: parseInt(Total_PreRegistros),
        };
    }));
    return arrayCom;
}


const totalEntradasxMes = async (Mes: any) => {
    let eventQuery = `SELECT count(distinct(hes."Solicitud"))as "Total_Entradas" from "HistorialEntradaSalida" hes 
                        WHERE "Tipo" = 1 AND extract (month from hes."FechaHora") = '${Mes}' AND "GCRecord" IS NULL `;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Entradas;
}

const totalSalidasxMes = async (Mes: any) => {
    let eventQuery = `SELECT count(distinct(hes."Solicitud"))as "Total_Salidas" from "HistorialEntradaSalida" hes 
    WHERE "Tipo" = 2 AND extract (month from hes."FechaHora") = '${Mes}' AND "GCRecord" IS NULL`;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Salidas;
}

const totalRegistrosxMEs = async (Mes: any) => { // Registros
    let eventQuery = `SELECT count(s."Oid")as "Total_Visitas" from "Solicitud" s 
       WHERE  extract(month from s."FechaHoraVisita") = '${Mes}'  AND "GCRecord" IS NULL AND s."Invitado" IS NOT NULL`;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Visitas;
}

const totalReingresosxMES = async (Mes: any) => {
    let eventQuery = `SELECT COUNT(*) AS "Total_Reincresos"
    FROM (
      SELECT s."Invitado", COUNT(*) AS "EntradasEnElMismoDia"
      FROM "Solicitud" s
      JOIN "HistorialEntradaSalida" hes ON hes."Solicitud" = s."Oid" 
      WHERE hes."Tipo" = 1 AND hes."GCRecord" IS NULL 
      AND extract (month from hes."FechaHora") = '${Mes}' AND s."Invitado" IS NOT NULL
      GROUP BY s."Invitado", hes."FechaHora"::DATE
      HAVING COUNT(*) > 1
    ) AS subquery;
     `;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Reincresos;
}

const totalInvitadosxMes = async (Mes: any) => {
    let eventQuery = `SELECT count(distinct s."Invitado") as "Total_Invitados"  from "Solicitud" s 
    WHERE  extract(month from s."FechaHoraVisita") = '${Mes}' 
    AND s."Invitado" IS NOT NULL AND "GCRecord" IS null`;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Invitados;
}

const totalPreRegistrosxMes = async (Mes: any) => { // Registros
    let eventQuery = `SELECT count(s."Oid")as "Total_PreRegistros" from "Solicitud" s 
        WHERE  extract(month from s."FechaHoraVisita") = '${Mes}'AND "GCRecord" IS null
            AND s."Invitado" IS NOT null and s."EsPreregistro" is true `;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_PreRegistros;
}
 

 const totalEntradasXDia = async () => {
    let eventQuery = `SELECT COUNT(DISTINCT(hes."Solicitud")) as  "Total_Entradas" FROM "HistorialEntradaSalida" hes 
                      WHERE "Tipo" = 1 AND "FechaHora"::DATE = current_date AND "GCRecord" IS NULL`;
    let res = await psql.manyOrNone(eventQuery); 
    return res[0].Total_Entradas;
}


 const totalSalidasXDias = async () => {
    let eventQuery = `SELECT COUNT(DISTINCT(hes."Solicitud")) as "Total_Salidas" FROM "HistorialEntradaSalida" hes 
                    WHERE "Tipo" = 2 AND "FechaHora"::DATE = current_date AND "GCRecord" IS null`;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Salidas;
}

 const totalReingresosXDia = async () => {
    let eventQuery = `SELECT COUNT(*) AS "Total_Reincresos"
  FROM (
    SELECT s."Invitado", COUNT(*) AS "EntradasEnElMismoDia"
    FROM "Solicitud" s
    JOIN "HistorialEntradaSalida" hes ON hes."Solicitud" = s."Oid" 
    WHERE hes."Tipo" = 1 AND hes."GCRecord" IS NULL 
    AND  hes."FechaHora"::DATE = current_date AND s."Invitado" IS NOT NULL
    GROUP BY s."Invitado", hes."FechaHora"::DATE
    HAVING COUNT(*) > 1
  ) AS subquery;
   `;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Reincresos;
}
 
 const totalRegistrosXDia = async () => { // Registros
    let eventQuery = `SELECT count(s."Oid")as "Total_Visitas" from "Solicitud" s 
       WHERE s."FechaHoraVisita"::DATE = current_date AND "GCRecord" IS NULL AND s."Invitado" IS NOT NULL`; 
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Visitas;
}

 const totalInvitadosXDia = async () => {
    let eventQuery = `SELECT count(distinct s."Invitado") as "Total_Invitados"  from "Solicitud" s 
    WHERE   s."FechaHoraVisita"::date =  current_date
    AND s."Invitado" IS NOT NULL AND "GCRecord" IS null`;
    let res = await psql.manyOrNone(eventQuery);
    return res[0].Total_Invitados;
}


 const totalPreRegistrosxDia = async () => { // Registros
    let eventQuery = `SELECT count(s."Oid")as "Total_PreRegistros" from "Solicitud" s 
        WHERE  s."FechaHoraVisita"::date = current_date AND "GCRecord" IS null
            AND s."Invitado" IS NOT null and s."EsPreregistro" is true `;
    let res = await psql.manyOrNone(eventQuery); 
    return res[0].Total_PreRegistros;
}


export const generarResultadosXDia = async () => {
    const Total_Entradas = parseInt(await totalEntradasXDia()) ;
    const Total_Salidas = parseInt(await totalSalidasXDias());
    const Total_Visitas = parseInt(await totalRegistrosXDia());
    const Total_Invitados = parseInt(await totalInvitadosXDia());
    const Total_PreRegistros = parseInt(await totalPreRegistrosxDia()); 
    const Total_Adentro = await  Math.abs(Total_Entradas - Total_Salidas);
    const Reingresos =parseInt( await totalReingresosXDia());
  
    return [{
        Total_Invitados: isNaN(Total_Invitados)? 0 : Total_Invitados,
        Total_Visitas: isNaN(Total_Visitas)? 0 : Total_Visitas,
        Total_Entradas: isNaN(Total_Entradas)? 0 : Total_Entradas,
        Total_Salidas: isNaN(Total_Salidas)? 0 : Total_Salidas,
        Total_Adentro: Total_Adentro,
        Reingresos: isNaN(Reingresos)? 0 : Reingresos,
        Total_PreRegistros: isNaN(Total_PreRegistros? 0 : Total_PreRegistros)
    }];   
}
