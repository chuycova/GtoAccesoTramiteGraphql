import { agregarResultadosXMes, agregarSalidasyEntradas, generarFechasXRango, generarMEsesXRangoFecha, generarResultadosXDia, getValuesPorFechas } from "./querys.reportes";

export const get_ReporteSolicitudAcceso = ` SELECT 
     s."Oid",
     s."Asunto",
     CASE 
       WHEN to_char(s."FechaHoraVisita",'yyyy-MM-dd') >= to_char((select now()),'yyyy-MM-dd') THEN true
       ELSE false
     END AS "Activa",
     to_char(s."FechaHoraVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraVisita",
     to_char(s."FechaHoraFinVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraFinVisita",
     to_char(s."FechaHoraAceptacion",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraAceptacion",
     to_char(s."FechaHoraSolicitud",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraSolicitud",
     COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "VisitaA",
     u."Correo" AS "CorreoVisitaA",
     u."EdificioUbicacion",
     u."ExtensionTelefonica",
     cd."Nombre" AS "Departamento",
     cp."Nombre" AS "Posicion",
     co."Nombre" AS "Oficina",
     ce."Nombre" AS "Edificio",
     i."Oid" AS "OidInvitado",
     CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") AS "NombreInvitado", 
     i."Nombres",
     i."PrimerApellido",
     i."SegundoApellido",
     cs."Oid" AS "OidSexo",
     cs."Nombre" AS "Sexo",
     s."InstitucionOrigen" AS "Procedencia",
     i."Correo" AS "CorreoInvitado",
     i."Telefono",
     s."FotografiaB64",
     s."Notificado",
     concat(ua."Nombres",' ',ua."PrimerApellido",' ', ua."SegundoApellido") as "NombreCompletoRegistra",
     ci."Nombre" as "TipoIdentificacion",
     s."PersonaVisitada",
     s."IngresaEquipo",
     s."NumeroTarjeta",
   ( select to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') from "HistorialEntradaSalida" hes where hes."Solicitud" = s."Oid" and hes."Tipo" = 1  order by hes."FechaHora" desc limit 1) as "FechaUltimaHoraEntrada",
   ( select to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') from "HistorialEntradaSalida" hes where hes."Solicitud" = s."Oid" and hes."Tipo" = 2  order by hes."FechaHora" desc limit 1) as "FechaUltimaHoraSalida",
    (SELECT COUNT(*) FROM "Solicitud" s 
   where s."Invitado" = i."Oid") AS "TotalNumVisitas",
   cps."Nombre" as "CargoPersonaVisitada"
   FROM "Solicitud" s
   INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
   INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
   LEFT JOIN "CatalogoDepartamento" cd ON cd."Oid" = u."Departamento" AND cd."Activo" is true AND cd."GCRecord" IS NULL
   LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = u."Posicion" AND cp."Activo" is true AND cp."GCRecord" IS NULL
   LEFT JOIN "CatalogoOficina" co ON co."Oid" = u."Oficina" AND co."Activo" is true AND co."GCRecord" IS NULL
   LEFT JOIN "CatalogoEdificio" ce ON ce."Oid" = u."Edificio" AND ce."Activo" is true AND ce."GCRecord" IS NULL
   INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
   LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = i."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS null
   LEFT JOIN "UsuarioAcceso" ua ON ua."Oid" = s."RegistraEnVentanilla" AND ua."Activo" is true AND ua."GCRecord" IS null
   LEFT JOIN "CatalogoIdentificacion" ci ON ci."Oid" = s."MedioIdentificacion"  AND ci."GCRecord" IS null
   LEFT JOIN "CatalogoPosicion" cps ON cps."Oid" = s."CargoPersonaVisitada" AND cp."Activo" is true AND cp."GCRecord" IS NULL
   WHERE s."GCRecord" IS null
   order by s."FechaHoraVisita" desc;`;

export const get_ReporteListaNegra = `
   SELECT 
       ln."Oid",
       ln."NombreLimpio",
       CONCAT(ln."Nombres",' ',ln."PrimerApellido",' ',ln."SegundoApellido") AS "NombreInvitado", 
       ln."Nombres",
       ln."PrimerApellido",
       ln."SegundoApellido",
       cs."Oid" AS "OidSexo",
       cs."Nombre" AS "Sexo",
       cr."Nombre" AS "Restriccion",
       --ln."Procedencia",
       ln."PersonaVisitada",
       --cp."Nombre" AS "Cargo",
       to_char(ln."FechaBloqueo",'yyyy-MM-dd') AS "FechaBloqueo",
       ln."MotivoBloqueo",
       ln."UrlOficio",
       ln."MotivoFavor",
       ln."Activo",
       CASE WHEN ln."Activo" IS TRUE THEN 'Si' ELSE 'No' END AS "ActivoString",
       to_char(ln."FechaCreacion",'yyyy-MM-dd') AS "FechaCreacion",
       to_char(ln."FechaActualizacion",'yyyy-MM-dd') AS "FechaActualizacion"
   FROM "ListaNegra" ln
   LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = ln."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS NULL
   LEFT JOIN "CatalogoRestriccion" cr ON cr."OID" = ln."Restriccion" AND cr."Activo" is true AND cr."GCRecord" IS NULL
   --LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = ln."Cargo" AND cp."Activo" is true AND cp."GCRecord" IS NULL
   WHERE ln."GCRecord" IS NULL 
   ORDER BY 1;`;
// export const get_GraficaXDia = ` SELECT 
// COUNT(DISTINCT s."Invitado") AS "Total_Invitados",
// COUNT(DISTINCT s."Oid") AS "Total_Visitas",
// SUM(case when entrada_salida."Tipo" = 1 then 1 else 0 end) as "Total_Entradas",
// SUM(case when entrada_salida."Tipo" = 2 then 1 else 0 end) as "Total_Salidas"
// FROM "Solicitud" s
// INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" and s."Invitado" is not null
// LEFT JOIN ( select hes."Solicitud", max(hes."FechaHora")::date as "Fecha",hes."Tipo"  
// from "HistorialEntradaSalida" hes
// where "GCRecord" is null 
// group by hes."Solicitud",hes."Tipo") entrada_salida ON s."Oid" = entrada_salida."Solicitud"
// WHERE  s."GCRecord" IS null
// and s."FechaHoraVisita"::date = current_date`;

// export const get_GraficaXAnio = (fechaInicio: string,
//   fechaFin: string) => {
//   const query = ` select * ,CASE
//   WHEN "Total_Entradas" > 0 THEN "Total_Entradas" - "Total_Salidas"
//   ELSE 0
// END AS "Total_Adentro",
// CASE
//     WHEN "Total_Visitas" > 0 AND "Total_Entradas" > 0 THEN "Total_Visitas" - "Total_Entradas"
//     ELSE 0
//   END AS "Reingresos" from ( SELECT 
//   case 
//     when meses.mes_numero = 1 then 'Enero'
//     when meses.mes_numero = 2 then 'Febrero'
//     when meses.mes_numero = 3 then 'Marzo'
//     when meses.mes_numero = 4 then 'Abril'
//     when meses.mes_numero = 5 then 'Mayo'
//     when meses.mes_numero = 6 then 'Junio'
//     when meses.mes_numero = 7 then 'Julio'
//     when meses.mes_numero = 8 then 'Agosto'
//     when meses.mes_numero = 9 then 'Septiembre'
//     when meses.mes_numero = 10 then 'Octubre'
//     when meses.mes_numero = 11 then 'Noviembre'
//     when meses.mes_numero = 12 then 'Diciembre'
//   end AS "Mes",
//   COUNT(DISTINCT s."Invitado") AS "Total_Invitados",
//   COUNT(s."Oid") AS "Total_Visitas",
//   (select count (distinct(hes."Solicitud")) from "HistorialEntradaSalida" hes 
//   where "Tipo" = 1
//   and
//   EXTRACT(MONTH FROM hes."FechaHora") = meses.mes_numero
// and hes."FechaHora"::date >= '${fechaInicio}'
// and hes."FechaHora"::date <= '${fechaFin}'
//   and "GCRecord" IS null
//   ) as "Total_Entradas",
//    (select count(distinct(hes."Solicitud")) from "HistorialEntradaSalida" hes 
//   where "Tipo" = 2
//   and
//  EXTRACT(MONTH FROM hes."FechaHora") = meses.mes_numero
//  and hes."FechaHora"::date >= '${fechaInicio}'
// and hes."FechaHora"::date <= '${fechaFin}'
//  and  "GCRecord" IS null
//   ) AS "Total_Salidas"
// from   (SELECT generate_series(1, 12) AS mes_numero) as meses 
// LEFT join "Solicitud" s ON EXTRACT(MONTH FROM s."FechaHoraVisita") = meses.mes_numero
// and s."FechaHoraVisita"::date >= '${fechaInicio}'
// and s."FechaHoraVisita"::date <= '${fechaFin}'  and s."Invitado" is not null
// WHERE 
//     s."GCRecord" IS null
// GROUP BY
//     meses.mes_numero
// ORDER BY
//   meses.mes_numero ) as "Data";`;
//   return query;
// };

export const get_AniosVisitasRegistradas = `select 
        DISTINCT EXTRACT(YEAR FROM s."FechaHoraVisita") AS "Anio" 
    from "Solicitud" s 
        where s."GCRecord" is null and s."Invitado" is not null 
   order by "Anio" ;`;

export const get_SemanaVisitas = `
select *,CASE
    WHEN "Total_Entradas" >  0 THEN "Total_Entradas" - "Total_Salidas"
    ELSE 0
  END AS "Total_Adentro",
  CASE
    WHEN "Total_Entradas" > 0 AND "Total_Invitados" > 0 THEN "Total_Entradas" - "Total_Invitados"
    ELSE 0
  END AS "Reingresos" from (  SELECT 
    dias."Dia",
    to_char(dias."Fecha",'dd-MM-yyyy') AS "Fecha",
    COUNT(DISTINCT s."Invitado") AS "Total_Invitados",
    COUNT(s."Oid") AS "Total_Visitas",
    (SELECT COUNT (DISTINCT(hes."Solicitud")) FROM "HistorialEntradaSalida" hes 
    WHERE "Tipo" = 1
    AND hes."FechaHora"::DATE = dias."Fecha"::DATE
    AND "GCRecord" IS NULL
    ) as "Total_Entradas",
     (select count(distinct(hes."Solicitud")) from "HistorialEntradaSalida" hes 
    where "Tipo" = 2
    AND hes."FechaHora"::DATE = dias."Fecha"::DATE
    AND "GCRecord" IS NULL
    ) AS "Total_Salidas"
from  (SELECT 
   CASE 
    WHEN dias_semana.dias = 0 THEN 'Domingo'
    WHEN dias_semana.dias = 1 THEN 'Lunes'
    WHEN dias_semana.dias = 2 THEN 'Martes'
    WHEN dias_semana.dias = 3 THEN 'Miércoles'
    WHEN dias_semana.dias = 4 THEN 'Jueves'
    WHEN dias_semana.dias = 5 THEN 'Viernes'
    WHEN dias_semana.dias = 6 THEN 'Sábado'
    END AS "Dia",
   CASE 
    WHEN dias_semana.dias = 1 THEN CAST(CURRENT_DATE as DATE) - CAST(CONCAT(EXTRACT(DOW FROM CURRENT_DATE)-1, ' days') AS INTERVAL)
    WHEN dias_semana.dias = 2 THEN CAST(CURRENT_DATE as DATE) - CAST(CONCAT(EXTRACT(DOW FROM CURRENT_DATE)-2, ' days') AS INTERVAL)
    WHEN dias_semana.dias = 3 THEN CAST(CURRENT_DATE as DATE) - CAST(CONCAT(EXTRACT(DOW FROM CURRENT_DATE)-3, ' days') AS INTERVAL)
    WHEN dias_semana.dias = 4 THEN CAST(CURRENT_DATE as DATE) - CAST(CONCAT(EXTRACT(DOW FROM CURRENT_DATE)-4, ' days') AS INTERVAL)
    WHEN dias_semana.dias = 5 THEN CAST(CURRENT_DATE as DATE) - CAST(CONCAT(EXTRACT(DOW FROM CURRENT_DATE)-5, ' days') AS INTERVAL)
    WHEN dias_semana.dias = 6 THEN CAST(CURRENT_DATE as DATE) - CAST(CONCAT(EXTRACT(DOW FROM CURRENT_DATE)-6, ' days') AS INTERVAL)
    WHEN dias_semana.dias = 0 THEN CAST(CURRENT_DATE as DATE) - CAST(CONCAT(EXTRACT(DOW FROM CURRENT_DATE)-7, ' days') AS INTERVAL)
    END AS "Fecha"
   FROM (SELECT generate_series(0,6) AS dias) AS dias_semana
   ORDER BY "Fecha") as dias 
LEFT JOIN
 "Solicitud" s ON s."FechaHoraVisita"::DATE = dias."Fecha"::DATE AND s."Invitado" IS NOT NULL
WHERE 
    s."GCRecord" IS null
GROUP BY
    dias."Dia",
    dias."Fecha"
ORDER BY
dias."Fecha" desc ) as data ;
   `;
export const get_VisitasCalendario = `
   SELECT 
  to_char(s."FechaHoraVisita"::date,'yyyy-MM-dd 00:00:00') AS "startDate",
  to_char(s."FechaHoraVisita"::date,'yyyy-MM-dd 22:59:00') AS "endDate",
    COUNT(DISTINCT s."Invitado") AS "Total_Invitados",
    COUNT(DISTINCT s."Oid") AS "Total_Visitas",
    SUM(case when entrada_salida."Tipo" = 1 then 1 else 0 end) as "Total_Entradas",
    SUM(case when entrada_salida."Tipo" = 2 then 1 else 0 end) as "Total_Salidas"
FROM "Solicitud" s
INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS null
LEFT JOIN ( select hes."Solicitud", max(hes."FechaHora")::date as "Fecha",hes."Tipo"  
 from "HistorialEntradaSalida" hes
 where "GCRecord" is null 
 group by hes."Solicitud",hes."Tipo") entrada_salida ON s."Oid" = entrada_salida."Solicitud"
WHERE  s."GCRecord" IS null
group by s."FechaHoraVisita"::Date
order by "startDate";

   `;
export const get_CalendarioSolicitudPorDias = (fecha: any) => {
  const query = `     SELECT 
    s."Oid",
    s."Asunto",
    CASE 
      WHEN to_char(s."FechaHoraVisita",'yyyy-MM-dd') >= to_char((select now()),'yyyy-MM-dd') THEN true
      ELSE false
    END AS "Activa",
    to_char(s."FechaHoraVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraVisita",
    to_char(s."FechaHoraFinVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraFinVisita",
    to_char(s."FechaHoraAceptacion",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraAceptacion",
    to_char(s."FechaHoraSolicitud",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraSolicitud",
    COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "VisitaA",
    u."Correo" AS "CorreoVisitaA",
    u."EdificioUbicacion",
    u."ExtensionTelefonica",
    cd."Nombre" AS "Departamento",
    cp."Nombre" AS "Posicion",
    co."Nombre" AS "Oficina",
    ce."Nombre" AS "Edificio",
    i."Oid" AS "OidInvitado",
    CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") AS "NombreInvitado", 
    i."Nombres",
    i."PrimerApellido",
    i."SegundoApellido",
    cs."Oid" AS "OidSexo",
    cs."Nombre" AS "Sexo",
    s."InstitucionOrigen" AS "Procedencia",
    i."Correo" AS "CorreoInvitado",
    i."Telefono",
    s."Notificado",
    concat(ua."Nombres",' ',ua."PrimerApellido",' ', ua."SegundoApellido") as "NombreCompletoRegistra",
    ci."Nombre" as "TipoIdentificacion",
    s."PersonaVisitada",
    s."IngresaEquipo",
    s."NumeroTarjeta",
    s."EsPreregistro",
    s."FotografiaB64",
  ( select to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') from "HistorialEntradaSalida" hes where hes."Solicitud" = s."Oid" and hes."Tipo" = 1  order by hes."FechaHora" desc limit 1) as "FechaUltimaHoraEntrada",
  ( select to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') from "HistorialEntradaSalida" hes where hes."Solicitud" = s."Oid" and hes."Tipo" = 2  order by hes."FechaHora" desc limit 1) as "FechaUltimaHoraSalida",
   (SELECT COUNT(*) FROM "Solicitud" s 
  where s."Invitado" = i."Oid" and  s."FechaHoraVisita"::date = '${fecha}' ) AS "TotalNumVisitas",
  cps."Nombre" as "CargoPersonaVisitada"
  FROM "Solicitud" s
  INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
  LEFT JOIN "CatalogoDepartamento" cd ON cd."Oid" = u."Departamento" AND cd."Activo" is true AND cd."GCRecord" IS NULL
  LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = u."Posicion" AND cp."Activo" is true AND cp."GCRecord" IS NULL
  LEFT JOIN "CatalogoOficina" co ON co."Oid" = u."Oficina" AND co."Activo" is true AND co."GCRecord" IS NULL
  LEFT JOIN "CatalogoEdificio" ce ON ce."Oid" = u."Edificio" AND ce."Activo" is true AND ce."GCRecord" IS NULL
  INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
  LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = i."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS null
  LEFT JOIN "UsuarioAcceso" ua ON ua."Oid" = s."RegistraEnVentanilla" AND ua."Activo" is true AND ua."GCRecord" IS null
  LEFT JOIN "CatalogoIdentificacion" ci ON ci."Oid" = s."MedioIdentificacion"  AND ci."GCRecord" IS null
  LEFT JOIN "CatalogoPosicion" cps ON cps."Oid" = s."CargoPersonaVisitada" AND cp."Activo" is true AND cp."GCRecord" IS NULL
  WHERE s."GCRecord" IS null and s."FechaHoraVisita"::date = '${fecha}'  
  order by s."FechaHoraVisita" desc;`;
  return query;
};

//por parametros de fecha
// export const get_GraficaXDiaPorFecha = (
//   fechaInicio: string,
//   fechaFin: string
// ) => {
//   const query = `
//   select * ,CASE
//   WHEN "Total_Entradas" > 0  THEN "Total_Entradas" - "Total_Salidas"
//   ELSE 0
// END AS "Total_Adentro",
// CASE
//     WHEN "Total_Invitados_con_Entradas"  > 0 THEN "Total_Entradas" - "Total_Invitados_con_Entradas"
//     ELSE 0
//   END AS "Reingresos"
// from (SELECT 
// 	 COUNT(DISTINCT s."Invitado") AS "Total_Invitados",
// 	COUNT(DISTINCT s."Oid") AS "Total_Visitas",
// 	(SELECT COUNT(DISTINCT(hes."Solicitud")) FROM "HistorialEntradaSalida" hes WHERE "Tipo" = 1 AND "FechaHora"::DATE >= '${fechaInicio}' and "FechaHora"::DATE <= '${fechaFin}' AND "GCRecord" IS NULL) as "Total_Entradas",
// 	(SELECT COUNT(DISTINCT(hes."Solicitud")) FROM "HistorialEntradaSalida" hes WHERE "Tipo" = 2 AND "FechaHora"::DATE >= '${fechaInicio}' and "FechaHora"::DATE <= '${fechaFin}' AND "GCRecord" IS NULL) as "Total_Salidas",
//    (SELECT COUNT(DISTINCT(hes_i."Oid")) FROM "HistorialEntradaSalida" hes INNER JOIN "Solicitud" hes_s ON hes_s."Oid" = hes."Solicitud" AND hes_s."GCRecord" IS null INNER JOIN "Invitado" hes_i ON hes_i."Oid" = hes_s."Invitado" AND hes_i."GCRecord" IS null WHERE hes."Tipo" = 1 AND hes."FechaHora"::DATE >= '${fechaInicio}' AND hes."FechaHora"::DATE <= '${fechaFin}' AND hes."GCRecord" IS NULL) AS "Total_Invitados_con_Entradas"
// 	FROM "Solicitud" s
// 	INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS null
// 	LEFT JOIN ( select hes."Solicitud", max(hes."FechaHora")::date as "Fecha",hes."Tipo"  
// 	 from "HistorialEntradaSalida" hes 
// 	 where "GCRecord" is null 
// 	 group by hes."Solicitud",hes."Tipo") entrada_salida ON s."Oid" = entrada_salida."Solicitud"
// 	WHERE  s."GCRecord" IS null
// 	and s."FechaHoraVisita"::date >= '${fechaInicio}'
// 	and s."FechaHoraVisita"::date <= '${fechaFin}' ) as data
//     `;
//   return query;
// };
// export const get_GraficaXSemanaPorFechas = (
//   fechaInicio: string,
//   fechaFin: string
// ) => {
//   const query = `select * ,CASE
//   WHEN "Total_Entradas" > 0  THEN "Total_Entradas" - "Total_Salidas"
//   ELSE 0
// END AS "Total_Adentro",
// CASE
// WHEN "Total_Visitas" > 0 AND "Total_Entradas" > 0 THEN "Total_Visitas" - "Total_Entradas"
//     ELSE 0
//   END AS "Reingresos" from ( SELECT 
// dias."Dia",
// to_char(dias."Fecha",'dd-MM-yyyy') AS "Fecha",
// (SELECT COUNT(DISTINCT(hes_i."Oid")) FROM "HistorialEntradaSalida" hes INNER JOIN "Solicitud" hes_s ON hes_s."Oid" = hes."Solicitud" AND hes_s."GCRecord" IS null INNER JOIN "Invitado" hes_i ON hes_i."Oid" = hes_s."Invitado" AND hes_i."GCRecord" IS null WHERE hes."Tipo" = 1 AND hes."FechaHora"::DATE >= '${fechaInicio}' AND hes."FechaHora"::DATE <= '${fechaFin}' AND hes."GCRecord" IS NULL) AS "Total_Invitados_con_Entradas",
// COUNT(DISTINCT s."Invitado") AS "Total_Invitados",
// COUNT(s."Oid") AS "Total_Visitas",
// (SELECT COUNT (DISTINCT(hes."Solicitud")) FROM "HistorialEntradaSalida" hes 
// WHERE "Tipo" = 1
// AND hes."FechaHora"::DATE = dias."Fecha"::DATE
// AND "GCRecord" IS NULL
// ) as "Total_Entradas",
//  (select count(distinct(hes."Solicitud")) from "HistorialEntradaSalida" hes 
// where "Tipo" = 2
// AND hes."FechaHora"::DATE = dias."Fecha"::DATE
// AND "GCRecord" IS NULL
// ) AS "Total_Salidas"
// from  (SELECT 
// CASE 
// WHEN EXTRACT(DOW FROM dia."Fecha") = 0 THEN 'Domingo'
// WHEN EXTRACT(DOW FROM dia."Fecha") = 1 THEN 'Lunes'
// WHEN EXTRACT(DOW FROM dia."Fecha") = 2 THEN 'Martes'
// WHEN EXTRACT(DOW FROM dia."Fecha") = 3 THEN 'Miércoles'
// WHEN EXTRACT(DOW FROM dia."Fecha") = 4 THEN 'Jueves'
// WHEN EXTRACT(DOW FROM dia."Fecha") = 5 THEN 'Viernes'
// WHEN EXTRACT(DOW FROM dia."Fecha") = 6 THEN 'Sábado'
// END AS "Dia",
// dia."Fecha"
// FROM (SELECT date_trunc('day', dd)::date as "Fecha"
//   FROM generate_series
//       ( '${fechaInicio}'::timestamp 
//       , '${fechaFin}'::timestamp
//       , '1 day'::interval) dd) AS dia
// ORDER BY "Fecha") as dias 
// LEFT JOIN
// "Solicitud" s ON s."FechaHoraVisita"::DATE = dias."Fecha"::DATE AND s."Invitado" IS NOT NULL
// WHERE 
//   s."GCRecord" IS null
// GROUP BY
//   dias."Dia",
//   dias."Fecha"
// ORDER BY
//   dias."Fecha" desc ) as data;
//     `;
//   return query;
// };
export const get_ReporteSinSalidasXFecha = (
  fechaInicio: string,
  fechaFin: string
) => {
  const query = `
  select * from (
    SELECT 
       distinct s."Oid",
       s."Asunto",
       CASE 
         WHEN to_char(s."FechaHoraVisita",'yyyy-MM-dd') >= to_char((select now()),'yyyy-MM-dd') THEN true
         ELSE false
       END AS "Activa",
       to_char(s."FechaHoraVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraVisita",
       to_char(s."FechaHoraFinVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraFinVisita",
       to_char(s."FechaHoraAceptacion",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraAceptacion",
       to_char(s."FechaHoraSolicitud",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraSolicitud",
       COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "VisitaA",
       u."Correo" AS "CorreoVisitaA",
       u."EdificioUbicacion",
       u."ExtensionTelefonica",
       cd."Nombre" AS "Departamento",
       cp."Nombre" AS "Posicion",
       co."Nombre" AS "Oficina",
       ce."Nombre" AS "Edificio",
       i."Oid" AS "OidInvitado",
       CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") AS "NombreInvitado", 
       i."Nombres",
       i."PrimerApellido",
       i."SegundoApellido",
       cs."Oid" AS "OidSexo",
       cs."Nombre" AS "Sexo",
       s."InstitucionOrigen" AS "Procedencia",
       i."Correo" AS "CorreoInvitado",
       i."Telefono",
       s."FotografiaB64",
       s."Notificado",
       concat(ua."Nombres",' ',ua."PrimerApellido",' ', ua."SegundoApellido") as "NombreCompletoRegistra",
       ci."Nombre" as "TipoIdentificacion",
       s."PersonaVisitada",
       s."IngresaEquipo",
       s."NumeroTarjeta",
     ( select to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') from "HistorialEntradaSalida" hes where hes."Solicitud" = s."Oid" and hes."Tipo" = 1  order by hes."FechaHora" desc limit 1) as "FechaUltimaHoraEntrada",
     ( select to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') from "HistorialEntradaSalida" hes where hes."Solicitud" = s."Oid" and hes."Tipo" = 2 order by hes."FechaHora" desc limit 1) as "FechaUltimaHoraSalida",
      (SELECT COUNT(*) FROM "Solicitud" s 
     where s."Invitado" = i."Oid") AS "TotalNumVisitas",
     cps."Nombre" as "CargoPersonaVisitada",
     s."Invitado"
     FROM "Solicitud" s
     INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
     INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
     LEFT JOIN "CatalogoDepartamento" cd ON cd."Oid" = u."Departamento" AND cd."Activo" is true AND cd."GCRecord" IS NULL
     LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = u."Posicion" AND cp."Activo" is true AND cp."GCRecord" IS NULL
     LEFT JOIN "CatalogoOficina" co ON co."Oid" = u."Oficina" AND co."Activo" is true AND co."GCRecord" IS NULL
     LEFT JOIN "CatalogoEdificio" ce ON ce."Oid" = u."Edificio" AND ce."Activo" is true AND ce."GCRecord" IS NULL
     INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
     LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = i."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS null
     LEFT JOIN "UsuarioAcceso" ua ON ua."Oid" = s."RegistraEnVentanilla" AND ua."Activo" is true AND ua."GCRecord" IS null
     LEFT JOIN "CatalogoIdentificacion" ci ON ci."Oid" = s."MedioIdentificacion"  AND ci."GCRecord" IS null
     LEFT JOIN "CatalogoPosicion" cps ON cps."Oid" = s."CargoPersonaVisitada" AND cp."Activo" is true AND cp."GCRecord" IS null
     left JOIN "HistorialEntradaSalida" hes ON hes."Solicitud" = s."Oid"  AND hes."GCRecord" IS NULL
     WHERE s."GCRecord" IS null 
  ) as data where "FechaUltimaHoraSalida" is null and "FechaHoraVisita"::date >= '${fechaInicio}'::timestamp  AND "FechaHoraVisita"::date <= '${fechaFin}'::timestamp
  order by "FechaHoraVisita" desc
    `;
  return query;
};

export const get_VisitasCalendarioSimple = `
select 
to_char(s."FechaHoraVisita"::date,'yyyy-MM-dd 00:00:00') AS "startDate",
to_char(s."FechaHoraVisita"::date,'yyyy-MM-dd 22:59:00') AS "endDate",
SUM(case when entrada_salida."Tipo" = 1 then 1 else 0 end) as "Total_Entradas",
SUM(case when entrada_salida."Tipo" = 2 then 1 else 0 end) as "Total_Salidas"
from "Solicitud" s 
inner join (select i."Oid" as "Invitado",max(s1."FechaHoraVisita") as "FechaHora" from "Solicitud" s1
INNER JOIN "Invitado" i ON i."Oid" = s1."Invitado" AND i."GCRecord" IS null
where s1."GCRecord" is null 
group by i."Oid",s1."FechaHoraVisita":: date ) as ultima_visita_invitado on ultima_visita_invitado."Invitado" = s."Invitado" and ultima_visita_invitado."FechaHora"=s."FechaHoraVisita" 
LEFT JOIN ( select hes."Solicitud", max(hes."FechaHora")::date as "Fecha",hes."Tipo"  
 from "HistorialEntradaSalida" hes
 where "GCRecord" is null 
 group by hes."Solicitud",hes."Tipo") entrada_salida ON s."Oid" = entrada_salida."Solicitud"
WHERE  s."GCRecord" IS null 
group by s."FechaHoraVisita":: date

   `;

export const get_ReporteCalendarioSimple = (fecha: any) => {
  const query = ` 
    SELECT 
    s."Oid",
    s."Asunto",
    CASE 
      WHEN to_char(s."FechaHoraVisita",'yyyy-MM-dd') >= to_char((select now()),'yyyy-MM-dd') THEN true
      ELSE false
    END AS "Activa",
    to_char(s."FechaHoraVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraVisita",
    to_char(s."FechaHoraFinVisita",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraFinVisita",
    to_char(s."FechaHoraAceptacion",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraAceptacion",
    to_char(s."FechaHoraSolicitud",'yyyy-MM-dd HH24:mi:ss') AS "FechaHoraSolicitud",
    COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "VisitaA",
    u."Correo" AS "CorreoVisitaA",
    u."EdificioUbicacion",
    u."ExtensionTelefonica",
    cd."Nombre" AS "Departamento",
    cp."Nombre" AS "Posicion",
    co."Nombre" AS "Oficina",
    ce."Nombre" AS "Edificio",
    i."Oid" AS "OidInvitado",
    CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") AS "NombreInvitado", 
    i."Nombres",
    i."PrimerApellido",
    i."SegundoApellido",
    cs."Oid" AS "OidSexo",
    cs."Nombre" AS "Sexo",
    s."InstitucionOrigen" AS "Procedencia",
    i."Correo" AS "CorreoInvitado",
    i."Telefono",
    s."Notificado",
    concat(ua."Nombres",' ',ua."PrimerApellido",' ', ua."SegundoApellido") as "NombreCompletoRegistra",
    ci."Nombre" as "TipoIdentificacion",
    s."PersonaVisitada",
    s."IngresaEquipo",
    s."NumeroTarjeta",
    s."FotografiaB64",
  ( select to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') from "HistorialEntradaSalida" hes where hes."Solicitud" = s."Oid" and hes."Tipo" = 1  order by hes."FechaHora" desc limit 1) as "FechaUltimaHoraEntrada",
  ( select to_char(hes."FechaHora",'yyyy-MM-dd HH24:mi:ss') from "HistorialEntradaSalida" hes where hes."Solicitud" = s."Oid" and hes."Tipo" = 2  order by hes."FechaHora" desc limit 1) as "FechaUltimaHoraSalida",
   (SELECT COUNT(*) FROM "Solicitud" s 
  where s."Invitado" = i."Oid" and  s."FechaHoraVisita"::date = '${fecha}' ) AS "TotalNumVisitas",
  cps."Nombre" as "CargoPersonaVisitada"
  FROM "Solicitud" s
  inner join (select i."Oid" as "Invitado",max(s."FechaHoraVisita") as "FechaHora" from "Solicitud" s 
	INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS null
	where s."GCRecord" is null 
	and "FechaHoraVisita"::date = '${fecha}'  
	group by i."Oid" ) as ultima_visita_invitado on ultima_visita_invitado."Invitado" = s."Invitado" and ultima_visita_invitado."FechaHora"=s."FechaHoraVisita" 
  INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
  LEFT JOIN "CatalogoDepartamento" cd ON cd."Oid" = u."Departamento" AND cd."Activo" is true AND cd."GCRecord" IS NULL
  LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = u."Posicion" AND cp."Activo" is true AND cp."GCRecord" IS NULL
  LEFT JOIN "CatalogoOficina" co ON co."Oid" = u."Oficina" AND co."Activo" is true AND co."GCRecord" IS NULL
  LEFT JOIN "CatalogoEdificio" ce ON ce."Oid" = u."Edificio" AND ce."Activo" is true AND ce."GCRecord" IS NULL
  INNER JOIN "Invitado" i ON i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
  LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = i."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS null
  LEFT JOIN "UsuarioAcceso" ua ON ua."Oid" = s."RegistraEnVentanilla" AND ua."Activo" is true AND ua."GCRecord" IS null
  LEFT JOIN "CatalogoIdentificacion" ci ON ci."Oid" = s."MedioIdentificacion"  AND ci."GCRecord" IS null
  LEFT JOIN "CatalogoPosicion" cps ON cps."Oid" = s."CargoPersonaVisitada" AND cp."Activo" is true AND cp."GCRecord" IS NULL
  WHERE s."GCRecord" IS null and s."FechaHoraVisita"::date = '${fecha}'  
  order by s."FechaHoraVisita" desc;
    `;
  return query;
}

export const get_GraficaXSemanaPorFechas = async (fecha: any, fechaFin: any) => { // get_GraficaXSemanaPorFechas
  const rangoXFechas = await generarFechasXRango(fecha, fechaFin);
  const arrayWithHors = await agregarSalidasyEntradas(rangoXFechas);
  return arrayWithHors
}

export const get_GraficaXDiaPorFecha = async (fechaInicio: string, fechaFin: string) => { // allGraficaXDiaPorParametros
  const result = await getValuesPorFechas(fechaInicio, fechaFin);  
  return result;
};

export const get_GraficaXAnio = async (fechaInicio: string, fechaFin: string) => { // allGraficaXAnio 
  const result = await generarMEsesXRangoFecha(fechaInicio, fechaFin); 
  const restValues = await agregarResultadosXMes(result); 
  return restValues;
};

export const get_GraficaXDia = async () =>{ 
 const result = await generarResultadosXDia();  
 return result;
} 