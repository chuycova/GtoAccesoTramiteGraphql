export const get_ExistePostulacionInvitado = (oid: String) => {
  const query = `SELECT
    it."Oid" AS "OidPostulacion",
    it."Folio" AS "FolioPostulacion",
    s."Oid" AS "OidSolicitud",
    i."Oid" AS "OidInvitado",
    i."Nombres",
    i."PrimerApellido",
    i."SegundoApellido",
    i."CURP",
    i."Correo",
    t."Oid" AS "OidTramite",
    t."Titulo" AS "Tramite",
    d."Oid" AS "OidDependencia",
    d."Titulo" AS "Dependencia",
    it."Aceptado",
    CASE WHEN s."Oid" IS NULL THEN false
    ELSE true END AS "CitaRealizada",
    CASE WHEN s."Estatus" = 0 THEN true
    ELSE false END AS "Confirmar"
  FROM "InvitadoTramite" it
  INNER JOIN "Invitado" i on i."Oid" = it."InvitadoDetalle" 
  INNER JOIN "Tramite" t on t."Oid" = it."TramiteDetalle" 
  INNER JOIN "Dependencia" d ON d."Oid" = t."Dependencia" 
  LEFT JOIN "Solicitud" s ON s."InvitadoTramite" = it."Oid" AND s."GCRecord" IS NULL
  WHERE it."GCRecord" is null
  AND it."Oid" = '${oid}' LIMIT 1`;
  return query;
};

export const get_Tramites =
`SELECT
  t."Oid",
  t."Titulo",
  t."Sufijo",
  t."Descripcion",
  d."Oid",
  d."Titulo"  
FROM "Tramite" t 
INNER JOIN "Dependencia" d ON d."Oid"=t."Dependencia" 
WHERE t."GCRecord" IS NULL
AND t."Activa" IS TRUE
ORDER BY t."Orden" DESC,t."Titulo"
`;
export const get_SedeTramiteXTramite = (tramite: String) => {
  const query = `SELECT 
    s."Oid",
    s."Nombre",
    s."Direccion",
    st."Oid" AS "SedeTramite", 
    st."Tramite"
  FROM "Sede" s
  INNER JOIN"SedeDependencia" sd on sd."Sede" =s."Oid" 
  INNER JOIN"SedeTramite" st on sd."Oid" = st."Sede"
  WHERE st."Tramite" = '${tramite}'
  AND st."Visible" IS TRUE
  AND s."Visible" IS TRUE
  AND s."GCRecord" IS NULL;`;
  return query;
};

export const get_FechasXSedeTramite = (sedeTramite: String) => {
  const query = `SELECT 
    --hc."Oid",
    '${sedeTramite}' AS "SedeTramite",
    to_char(hc."FechaCita",'dd-MM-yyyy') "FechaCita",
    SUM(hc."Disponibilidad") AS "Disponibilidad",
    SUM(hc."Ocupados") AS "Ocupados"
  FROM "HorarioCita" hc
  WHERE hc."Tramite" = '${sedeTramite}'
  AND hc."FechaCita"::DATE >= (NOW()::DATE + INTERVAL '1 day')
  AND hc."Disponibilidad" > hc."Ocupados" 
  AND hc."GCRecord" IS NULL
  GROUP BY  hc."FechaCita"
  ORDER BY hc."FechaCita";`;
  return query;
};

export const get_HorariosXSedeTramite = (sedeTramite: String,fechaCita: String) => {
  const query = `SELECT 
    hc."Oid",
    hc."IniciaCita",
    to_char(hc."FechaCita",'dd-MM-yyyy') "FechaCita",
    hc."Disponibilidad",
    hc."Ocupados"
  FROM "HorarioCita" hc
  WHERE hc."Tramite" = '${sedeTramite}'
  AND hc."FechaCita"::date = '${fechaCita}'
  AND hc."Disponibilidad" > hc."Ocupados" 
  AND hc."GCRecord" IS NULL
  ORDER BY hc."IniciaCita";`;
  return query;
};


//REVISAR
export const get_HorariosXSedeTramiteXFecha = (sedeTramite: String,fechaCita: String) => {
  const query = `SELECT 
    hc."Oid",
    hc."IniciaCita",
    to_char(hc."FechaCita",'dd-MM-yyyy') "FechaCita",
    hc."Disponibilidad",
    hc."Ocupados"
  FROM "HorarioCita" hc
  WHERE hc."Tramite" = (SELECT st."Oid" FROM "SedeTramite" st INNER JOIN "SedeDependncia sd ON sd."Sede" = '${sedeTramite}') 
  AND hc."FechaCita"::date = '${fechaCita}'
  AND hc."Disponibilidad" > hc."Ocupados" 
  AND hc."GCRecord" IS NULL
  ORDER BY hc."IniciaCita";`;
  return query;
};

// export const get_ValidarHorarioDisponible = (sedeTramite: String,horario: String) => {
//   const query = `SELECT 
//     hc."Oid",
//     hc."IniciaCita",
//     to_char(hc."FechaCita",'dd-MM-yyyy') "FechaCita",
//     hc."Disponibilidad",
//     hc."Ocupados"
//   FROM "HorarioCita" hc
//   WHERE hc."Tramite" = '${sedeTramite}'
//   AND hc."FechaCita"::date = '${fechaCita}'
//   AND hc."Disponibilidad" > hc."Ocupados" 
//   AND hc."GCRecord" IS NULL
//   ORDER BY hc."IniciaCita";`;
//   return query;
// };

/*select 
  ven."SedeVentanilla",
    ven."SedeDependencia",
    ven."Dependencia",
    ven."NombreVentanilla",
    ven."TramiteVentanilla",
  ven."IniciaCita",
     ven."FechaCita",
    ven."Disponibilidad",
    ven."Ocupados"   
 from (  
    select "HorarioCita","Ventanilla","Tramite"  from "Solicitud" s where s."Estatus" = 1
    and s."HorarioCita" = '0f019058-ccba-49f3-b08a-93287564dd59'
    and s."GCRecord" is null) as sol
  right  join 
   (select 
     sv."Oid" as "SedeVentanilla",
    st."Sede" as "SedeDependencia",
    st."Dependencia",
    sv."Nombre" as "NombreVentanilla",
    tv."Oid" as "TramiteVentanilla",
  hc."IniciaCita",
    to_char(hc."FechaCita",'dd-MM-yyyy' ) as "FechaCita",
    hc."Disponibilidad",
    hc."Ocupados" 
  from "SedeVentanilla" sv 
  inner join "TramiteVentanilla" tv on tv."Ventanilla" = sv."Oid" 
  inner join "SedeTramite" st on st."Oid" = tv."Tramite"
  inner join "Tramite" t on t."Oid" = st."Tramite" 
  inner join "HorarioCita" hc on hc."Tramite" = st."Oid"
  where hc."Oid" = '0f019058-ccba-49f3-b08a-93287564dd59'
  and hc."FechaCita" > (select now()) 
  order by t."Titulo", hc."FechaCita", hc."IniciaCita" ) as ven  
 on sol."HorarioCita"= '0f019058-ccba-49f3-b08a-93287564dd59' and sol."Ventanilla" = ven."SedeVentanilla" and sol."Tramite" = ven."TramiteVentanilla"
 where sol."HorarioCita" is null */

export const get_VentanillaDisponible = (HorarioCita: String) => {
  const query = `select 
    sv."Oid" as "SedeVentanilla",
    st."Sede" as "SedeDependencia",
    st."Dependencia",
    sv."Nombre" as "NombreVentanilla",
    tv."Oid" as "TramiteVentanilla",
    tv."Oid" as "TramiteVentanilla",
	  hc."IniciaCita",
    to_char(hc."FechaCita",'dd-MM-yyyy' ),
    hc."Disponibilidad",
    hc."Ocupados" 
  from "SedeVentanilla" sv 
  inner join "TramiteVentanilla" tv on tv."Ventanilla" = sv."Oid" 
  inner join "SedeTramite" st on st."Oid" = tv."Tramite" 
  inner join "HorarioCita" hc  ON hc."Tramite"  = st."Oid" 
  --left join "Solicitud" s on s."Ventanilla" = sv."Oid" and s."HorarioCita" = hc."Oid" and s."GCRecord" is null and s."Estatus" = 1
  where hc."Oid"  = '${HorarioCita}'
  AND hc."Disponibilidad" > hc."Ocupados" 
  AND sv."Visible" IS TRUE
  --AND s."Oid" IS NULL
  limit 1`;
  return query;
};

export const get_SolicitudCitaTramiteXOid = (Oid: String) => {
  const query = `select 
    s."Oid",
    s."Invitado",
    s."TipoVisita",
    it."Folio",
    i."Nombres",
    i."PrimerApellido",
    i."SegundoApellido",
    i."CURP",
    i."FotografiaB64" as "UrlFoto",
    cs."Oid" AS "OidSexo",
    cs."Nombre" AS "Sexo",
    s."InstitucionOrigen" AS "Procedencia",
    i."Correo",
    i."Telefono",
    s."InvitadoTramite",
    s."Sede" as "OidSede",
    se."Nombre" as "Sede",
    se."Clave" as "SedeClave",
    se."Direccion",
    s."Dependencia" as "OidDependencia",
    d."Titulo" as "Dependencia",
    s."Ventanilla" as "OidVentanilla",
    sv."Nombre" as "Ventanilla",
    COALESCE(sv."Ubicacion", '') AS "VentanillaUbicacion",
    s."Tramite" as "OidTramite",
    t."Titulo" as "Tramite",
    s."HorarioCita" as "OidHorarioCita",
    hc."IniciaCita" as "HorarioCita",
    to_char(s."FechaHoraVisita",'dd/MM/yyyy HH24:MI:SS') AS "FechaHoraVisita",
    to_char(s."FechaHoraFinVisita",'dd/MM/yyyy HH24:MI:SS') AS "FechaHoraFinVisita",
    s."Placas",
    CASE 
        WHEN s."Estatus" = 0 THEN 'Pendiente'
        WHEN s."Estatus" = 1 THEN 'Aceptado'
        WHEN s."Estatus" = 2 THEN 'Rechazado'
        WHEN s."Estatus" = 3 THEN 'Cancelado'
        ELSE '--'
      END AS "Estatus",
    to_char(s."FechaHoraSolicitud",'dd/MM/yyyy HH24:MI:SS') AS "FechaHoraSolicitud"
  from "Solicitud" s
  inner join "Invitado" i on i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
  inner join "InvitadoTramite" it on it."Oid" = s."InvitadoTramite" AND it."GCRecord" IS NULL
  LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = i."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS NULL
  INNER JOIN "Dependencia" d ON d."Oid" = s."Dependencia"  AND d."GCRecord" IS NULL
  INNER JOIN "SedeDependencia" sd ON sd."Dependencia" = d."Oid"  AND sd."GCRecord" IS NULL
  INNER JOIN "Sede" se ON se."Oid" = sd."Sede"  AND se."GCRecord" IS NULL
  INNER JOIN "SedeVentanilla" sv ON sv."Oid" = s."Ventanilla"  AND sv."GCRecord" IS NULL
  INNER JOIN "TramiteVentanilla" tv ON tv."Oid" = s."Tramite"  AND tv."GCRecord" IS NULL
  INNER JOIN "SedeTramite" st ON st."Oid" = tv."Tramite"  AND st."GCRecord" IS NULL
  INNER JOIN "Tramite" t ON t."Oid" = st."Tramite"  AND t."GCRecord" IS NULL
  INNER JOIN "HorarioCita" hc ON hc."Oid" = s."HorarioCita"  AND hc."GCRecord" IS NULL
  where s."GCRecord" is null
  AND s."Oid" = '${Oid}'
  limit 1;`;
  return query;
};

//---------------------------------Mutation --------------------------------//
const Oid = "(SELECT(uuid_in(overlay(overlay(md5(random()::text || ':' || clock_timestamp()::text) placing '4' from 13) placing to_hex(floor(random()*(11-8+1) + 8)::int)::text from 17)::cstring)))";

export const add_SolicitudCita = (solicitud:any,extra:any) => {
  const query = `INSERT INTO "Solicitud" 
  ("Oid", "InvitadoTramite","Sede","Dependencia","Ventanilla","Tramite","HorarioCita","FechaHoraVisita","FechaHoraFinVisita",
  "Invitado","Placas","Estatus","FechaHoraSolicitud","TipoVisita","VisitaA","PersonaVisitada","EsPrincipal","OptimisticLockField","GCRecord") VALUES 
  (${Oid},'${solicitud.InvitadoTramiteCita}','${extra.SedeDependencia}','${extra.Dependencia}','${extra.SedeVentanilla}','${extra.TramiteVentanilla}',
  '${solicitud.HoraCita}','${solicitud.FechaCita}', (SELECT
      TIMESTAMP '${solicitud.FechaCita}' + INTERVAL '1 minute' * tv."MinutoCita" 
      from "SedeVentanilla" sv 
      inner join "TipoVentanilla" tv on tv."Oid" = sv."TipoVentanilla" 
      where sv."Oid" = '${extra.SedeVentanilla}'),
      (SELECT "InvitadoDetalle" FROM "InvitadoTramite" WHERE "Oid"='${solicitud.InvitadoTramiteCita}'),'${solicitud.Placas}',0,
      (SELECT now()),3,
      (SELECT "Oid" FROM "PermissionPolicyUser" WHERE "UserName"='sistemaGTO'),
      (SELECT concat(d."Titulo",' ',t."Titulo")  FROM "Tramite" t
        INNER JOIN "Dependencia" d ON d."Oid" = t."Dependencia" AND d."GCRecord" IS NULL
        INNER JOIN "SedeTramite" st ON t."Oid" = st."Tramite" AND st."GCRecord" IS NULL
        INNER JOIN "TramiteVentanilla" tv ON tv."Tramite" = st."Oid"  AND tv."GCRecord" IS null
        WHERE t."GCRecord" IS NULL 
        AND tv."Oid"='${extra.TramiteVentanilla}' LIMIT 1),
      false,1,NULL)
      RETURNING "Oid";`;
  return query;
};
export const update_SolicitudCita = (solicitud:any,extra:any) => {
  const query = `UPDATE "Solicitud" 
    SET "Sede" = '${extra.SedeDependencia}',
        "Ventanilla" = '${extra.SedeVentanilla}',
        "HorarioCita" = '${solicitud.HoraCita}',
        "FechaHoraVisita" = '${solicitud.FechaCita}',
        "FechaHoraFinVisita" = (SELECT
          TIMESTAMP '${solicitud.FechaCita}' + INTERVAL '1 minute' * tv."MinutoCita" 
          from "SedeVentanilla" sv 
          inner join "TipoVentanilla" tv on tv."Oid" = sv."TipoVentanilla" 
          where sv."Oid" = '${extra.SedeVentanilla}'),
        "Placas" = '${solicitud.Placas}'
    WHERE "Oid" = '${solicitud.Oid}'
    RETURNING "Oid";`;
  return query;
};
export const update_ConfirmarCita = (solicitud:any,estatus:number) => {
  const query = `UPDATE "Solicitud" 
      SET "Estatus" = ${estatus},
      "PorCita" = true,
      "FechaHoraSolicitud" = (SELECT now())
    WHERE "Oid" = '${solicitud}'
    RETURNING "Oid";`;
  return query;
};
export const update_HorarioCita = (HorarioCita: String) => {
  const query = `UPDATE "HorarioCita"
    SET "Ocupados" = "Ocupados"+1
    WHERE "Oid" = '${HorarioCita}'`;
  return query;
};

export const add_PlacasInvitado = (placa: String,InvitadoTramite: String) => {
  const query = `DO $$ 
  BEGIN
    IF not exists(
      select ip."Oid" from "InvitadoPlacas" ip
      where ip."Placas"='${placa}' and ip."Invitado" = (SELECT "InvitadoDetalle" FROM "InvitadoTramite" WHERE "Oid"='${InvitadoTramite}') limit 1) THEN
        insert into "InvitadoPlacas"
        ("Oid","Invitado","Placas")
        VALUES(${Oid},(SELECT "InvitadoDetalle" FROM "InvitadoTramite" WHERE "Oid"='${InvitadoTramite}'),'${placa}'); 
    END IF;
  END $$`;
  return query;
};
export const add_PlacasInvitadoXVisita = (placa: String,marca: String,modelo: String,color: String,Invitado: String) => {
  const query = `DO $$ 
  DECLARE
    record_exists boolean;
  BEGIN
    SELECT EXISTS(
      SELECT 1 FROM "InvitadoPlacas"
      WHERE "Placas" = '${placa}' AND "Invitado" = '${Invitado}'
    ) INTO record_exists;
  
    IF NOT record_exists THEN
      INSERT INTO "InvitadoPlacas" ("Oid", "Invitado", "Placas", "Marca", "Modelo", "Color")
      VALUES (${Oid}, '${Invitado}', '${placa}', '${marca}', '${modelo}', '${color}');
    ELSE
      UPDATE "InvitadoPlacas"
      SET "Marca" = '${marca}', "Modelo" = '${modelo}', "Color" = '${color}'
      WHERE "Placas" = '${placa}' AND "Invitado" = '${Invitado}';
    END IF;
  END $$;`;
  return query;
};


















// export const get_LoginSolicitante = (correo: String, pass: String) => {
//   const query = ` SELECT 
//     s."Oid", 
//     CONCAT(s."Nombres",' ',s."PrimerApellido",' ',s."SegundoApellido") AS "NombreSolicitante", 
//     s."Nombres", 
//     s."PrimerApellido", 
//     s."SegundoApellido", 
//     s."Correo",
//     s."Telefono",
//     CASE 
//       WHEN s."FotografiaCaraSolicitanteB64" IS NOT NULL AND s."FotografiaCaraSolicitanteB64" != ''
//       AND s."FotografiaDelanteraINEB64" IS NOT NULL AND s."FotografiaDelanteraINEB64" != ''
//       AND s."FotografiaTraseraINEB64" IS NOT NULL AND s."FotografiaTraseraINEB64" != ''
//       THEN true
//       ELSE false
//     END AS "Fotos"
//     FROM "Solicitante" s
//     WHERE s."GCRecord" IS NULL
//     AND s."Correo" = '${correo}' AND s."Pass" = '${pass}'
//     AND s."Bloqueado" = false;`;
//   return query;
// };

// export const get_LoginSolicitanteBloqueado = (correo: String) => {
//   const query = ` SELECT 
//       s."Bloqueado"
//     FROM "Solicitante" s
//     WHERE s."GCRecord" IS NULL
//     AND s."Correo" = '${correo}'`;
//   return query;
// };

// export const get_LimiteVisitaSolicitante = (Oid: String, Fecha: String) => {
//   const fecha = Fecha.split('-');
//   const query = ` SELECT 
//     CASE WHEN s."MaxVisitasMes" <= (SELECT COUNT(*) FROM "Solicitud" soli 
//                               WHERE soli."GCRecord" IS NULL 
//                               AND soli."Solicitante" = '${Oid}'
//                               AND to_char(soli."FechaHoraVisita", 'MM') = '${fecha[1]}'     
//                               AND to_char(soli."FechaHoraVisita", 'yyyy') = '${fecha[0]}'        
//                               AND (soli."Estatus" != 2 OR soli."Estatus" != 3) )
//       THEN FALSE ELSE TRUE END AS "NuevaVisita",
//       s."MaxVisitasMes"
//     FROM "Solicitante" s
//     WHERE s."GCRecord" IS NULL
//     AND s."Oid" = '${Oid}';`;
//   return query;
// };

// export const get_TiposVisitas = (Oid: String) => {
//   const query = `SELECT 
//         ctv."Oid",
//         ctv."Nombre",
//         ctv."AforoMaximo",
//         ctv."AforoMinimo",
//         ctv."Descripcion"
//       FROM "CatalogoTipoVisita" ctv
//       WHERE ctv."GCRecord" IS NULL
//       AND ctv."Activa" IS TRUE
//       AND ctv."UsuarioAreaAsociacion" = '${Oid}'`;
//   return query;
// };

// export const get_DiasTipoVisita = (Oid: String) => {
//   const query = `SELECT 
//         ctv."Oid",
//         ctv."MostrarEnLunes",
//         ctv."MostrarEnMartes",
//         ctv."MostrarEnMiercoles",
//         ctv."MostrarEnJueves",
//         ctv."MostrarEnViernes"
//       FROM "CatalogoTipoVisita" ctv
//       WHERE ctv."GCRecord" IS NULL
//       AND ctv."Activa" IS TRUE
//       AND ctv."Oid" = '${Oid}'`;
//   return query;
// };

// export const get_CitasTipoVisita = (Oid: String) => {
//   const query = ` SELECT 
//     to_char(s."FechaHoraVisita",'yyyy-MM-dd') AS "FechaVisita",
//     CASE WHEN (count(*)) < ((ctv."GruposMaxXHorario" * 
//                 (SELECT COUNT(*) FROM "HorarioVisita" hv 
//                 WHERE hv."GCRecord" IS NULL 
//                 AND hv."Visible" IS TRUE 
//                 AND hv."TipoVisita" = '${Oid}'))/2)
//     THEN FALSE ELSE TRUE END AS "MasDeMitad",
//     CASE WHEN (count(*)) < ((ctv."GruposMaxXHorario" * 
//                 (SELECT COUNT(*) FROM "HorarioVisita" hv 
//                 WHERE hv."GCRecord" IS NULL 
//                 AND hv."Visible" IS TRUE 
//                 AND hv."TipoVisita" = '${Oid}')))
//     THEN FALSE ELSE TRUE END AS "Lleno",
//     ((ctv."GruposMaxXHorario" * (SELECT COUNT(*) FROM "HorarioVisita" hv WHERE hv."GCRecord" IS NULL AND hv."Visible" IS TRUE AND hv."TipoVisita" = '${Oid}'))) AS "Total",
//     count(*) AS "Cantidad"
//   FROM "CatalogoTipoVisita" ctv
//   INNER JOIN "Solicitud" s ON s."TipoVisita" = ctv."Oid" AND (s."Estatus" != 2 OR s."Estatus" != 3)
//   WHERE ctv."GCRecord" IS NULL
//   AND ctv."Activa" IS TRUE
//   AND to_char(s."FechaHoraVisita",'yyyy-MM-dd')  > to_char((SELECT NOW()),'yyyy-MM-dd') 
//   AND ctv."Oid" = '${Oid}'
//   GROUP BY 1,ctv."Oid";`;
//   return query;
// };
// export const get_TipoGruposTipoVisita = (Oid: String) => {
//   const query = `SELECT 
//   tg."Oid", 
//   tg."Nombre", 
//   tg."OcultarCampoInstitucion"
// FROM "TipoGrupo" tg
// INNER JOIN "TipoGrupoTiposGrupos_CatalogoTipoVisitaTiposVisitas" tvtg ON tvtg."TiposGrupos" = tg."Oid"
// WHERE tg."GCRecord" IS NULL 
// AND tg."Visible" IS TRUE
// AND tvtg."TiposVisitas" = '${Oid}'
// ORDER BY tg."Orden";`;
//   return query;
// };

// export const get_AllVisitas = (Oid: String) => {
//   const query = `SELECT 
//       s."Oid",
//       u."NombreCompleto" AS "VisitaA",
//       to_char(s."FechaHoraVisita",'dd/MM/yyyy HH24:MI:SS') AS "FechaHoraVisita",
//       CASE 
//         WHEN s."Estatus" = 0 THEN 'Pendiente'
//         WHEN s."Estatus" = 1 THEN 'Aceptado'
//         WHEN s."Estatus" = 2 THEN 'Rechazado'
//         WHEN s."Estatus" = 3 THEN 'Cancelado'
//         ELSE '--'
//       END AS "Estatus",
//       CASE 
//         WHEN (s."Estatus" = 3 OR s."Estatus" = 2) 
//         OR (s."TipoVisita" IS NOT NULL AND ctv."DiasCancelacion" >= extract(days from (s."FechaHoraVisita"-(SELECT current_date)) ))
//         OR extract(days from (s."FechaHoraVisita"-(SELECT current_date)) ) <= 0 THEN FALSE
//         ELSE TRUE
//       END AS "CancelacionValida",
//       CASE 
//         WHEN s."FechaHoraAceptacion" IS NULL THEN '--'
//         ELSE to_char(s."FechaHoraAceptacion",'dd/MM/yyyy HH24:MI:SS')
//       END AS "FechaHoraAceptacion",
//       CASE 
//         WHEN s."TipoVisita" IS NULL THEN '--'
//         ELSE ctv."Nombre"
//       END AS "TipoVisita"
//     FROM "Solicitud" s
//     INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
//     LEFT JOIN "CatalogoTipoVisita" ctv ON ctv."Oid" = s."TipoVisita" --AND ctv."GCRecord" IS NULL
//     WHERE s."GCRecord" IS NULL
//     AND s."Solicitante" = '${Oid}'
//     ORDER BY s."FechaHoraVisita" DESC`;
//   return query;
// };
// export const get_MisVisitas = (filtro: any) => {
//   let Oid = filtro.Oid;
//   let inicio = filtro.Offset;
//   let limit = filtro.Limit;

//   const query = `SELECT 
//   s."Oid",
//   u."NombreCompleto" AS "VisitaA",
//   to_char(s."FechaHoraVisita",'dd/MM/yyyy HH24:MI:SS') AS "FechaHoraVisita",
//   CASE 
//     WHEN s."Estatus" = 0 THEN 'Pendiente'
//     WHEN s."Estatus" = 1 THEN 'Aceptado'
//     WHEN s."Estatus" = 2 THEN 'Rechazado'
//     WHEN s."Estatus" = 3 THEN 'Cancelado'
//     ELSE '--'
//   END AS "Estatus",
//   CASE 
//     WHEN (s."Estatus" = 3 OR s."Estatus" = 2) 
//     OR (s."TipoVisita" IS NOT NULL AND ctv."DiasCancelacion" >= extract(days from (s."FechaHoraVisita"-(SELECT current_date)) ))
//     OR extract(days from (s."FechaHoraVisita"-(SELECT current_date)) ) <= 0 THEN FALSE
//     ELSE TRUE
//   END AS "CancelacionValida",
//   CASE 
//     WHEN s."FechaHoraAceptacion" IS NULL THEN '--'
//     ELSE to_char(s."FechaHoraAceptacion",'dd/MM/yyyy HH24:MI:SS')
//   END AS "FechaHoraAceptacion",
//   CASE 
//     WHEN s."TipoVisita" IS NULL THEN '--'
//     ELSE ctv."Nombre"
//   END AS "TipoVisita"
//   FROM "Solicitud" s
//   INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
//   LEFT JOIN "CatalogoTipoVisita" ctv ON ctv."Oid" = s."TipoVisita" --AND ctv."GCRecord" IS NULL
//   WHERE s."GCRecord" IS NULL
//   AND s."Solicitante" = '${Oid}'
//   ORDER BY s."FechaHoraVisita" DESC
//   OFFSET ${inicio} LIMIT ${limit}`;
//   return query;
// };
// export const get_MisVisitasPaginado = (filtro: any) => {
//   let Oid = filtro.Oid;
//   let limit = filtro.Limit;

//   const query = `SELECT 
//     count(*) AS "TotalRegistros",
//     ceiling(count(*)/${limit}.00) AS "Paginas"
//   FROM "Solicitud" s
//   INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
//   LEFT JOIN "CatalogoTipoVisita" ctv ON ctv."Oid" = s."TipoVisita" --AND ctv."GCRecord" IS NULL
//   WHERE s."GCRecord" IS NULL
//   AND s."Solicitante" = '${Oid}'`;
//   return query;
// };

// export const get_VisitaXOid = (Oid: String) => {
//   const query = `SELECT 
//       s."Oid",
//       s."Asunto",
//       u."NombreCompleto" AS "VisitaA",
//       to_char(s."FechaHoraVisita",'dd/MM/yyyy HH24:MI:SS') AS "FechaHoraVisita",
//       CASE 
//         WHEN s."Estatus" = 0 THEN 'Pendiente'
//         WHEN s."Estatus" = 1 THEN 'Aceptado'
//         WHEN s."Estatus" = 2 THEN 'Rechazado'
//         WHEN s."Estatus" = 3 THEN 'Cancelado'
//         ELSE '--'
//       END AS "Estatus",
//       CASE 
//         WHEN s."FechaHoraAceptacion" IS NULL THEN '--'
//         ELSE to_char(s."FechaHoraAceptacion",'dd/MM/yyyy HH24:MI:SS')
//       END AS "FechaHoraAceptacion",
//       CASE 
//         WHEN s."TipoVisita" IS NULL THEN '--'
//         ELSE ctv."Nombre"
//       END AS "TipoVisita",
//       CASE 
//         WHEN s."TipoVisita" IS NULL THEN '--'
//         ELSE ctv."Descripcion"
//       END AS "DescripcionTipoVisita",
//       ef."Nombre" AS "EntidadFederativa",
//       s."InstitucionOrigen" AS "Institucion",
//       s."NumeroSolicitadoVisitantes" AS "NumeroVisitantes",
//       s."MotivoCancelacion"
//     FROM "Solicitud" s
//     INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
//     LEFT JOIN "CatalogoTipoVisita" ctv ON ctv."Oid" = s."TipoVisita" --AND ctv."GCRecord" IS NULL
//     LEFT JOIN "EntidadFederativa" ef ON ef."Oid" = s."EntidadFederativaRepresenta" AND ctv."GCRecord" IS NULL
//     WHERE s."GCRecord" IS NULL
//     AND s."Oid" = '${Oid}'
//     LIMIT 1`;
//   return query;
// };

// export const get_CancelacionVisitaValida = (Oid: String) => {
//   const query = `SELECT 
//       s."Oid",
//       CASE 
//         WHEN s."Estatus" = 0 THEN 'Pendiente'
//         WHEN s."Estatus" = 1 THEN 'Aceptado'
//         WHEN s."Estatus" = 2 THEN 'Rechazado'
//         WHEN s."Estatus" = 3 THEN 'Cancelado'
//         ELSE '--'
//       END AS "Estatus",
//       to_char(s."FechaHoraVisita",'dd/MM/yyyy HH24:MI:SS') AS "FechaHoraVisita",
//       CASE 
//         WHEN  extract(days from (s."FechaHoraVisita"-(SELECT current_date)) ) <= 0 THEN NULL
//         ELSE ctv."DiasCancelacion"
//       END AS "DiasCancelacion",
//       CASE 
//         WHEN (s."Estatus" = 3 OR s."Estatus" = 2) 
//         OR (s."TipoVisita" IS NOT NULL AND ctv."DiasCancelacion" >= extract(days from (s."FechaHoraVisita"-(SELECT current_date)) ))
//         OR extract(days from (s."FechaHoraVisita"-(SELECT current_date)) ) <= 0 THEN FALSE
//         ELSE TRUE
//       END AS "Valido",
//       s."MotivoCancelacion"
//     FROM "Solicitud" s
//     INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
//     LEFT JOIN "CatalogoTipoVisita" ctv ON ctv."Oid" = s."TipoVisita" --AND ctv."GCRecord" IS NULL
//     WHERE s."GCRecord" IS NULL
//     AND s."Oid" = '${Oid}'
//     LIMIT 1`;
//   return query;
// };

// export const get_Visita = (Oid: String, FechaVisita: String) => {
//   const query = `SELECT 
//       s."Oid",
//       u."NombreCompleto" AS "VisitaA",
//       to_char(s."FechaHoraVisita",'dd/MM/yyyy HH24:MI:SS') AS "FechaHoraVisita",
//       CASE 
//         WHEN s."Estatus" = 0 THEN 'Pendiente'
//         WHEN s."Estatus" = 1 THEN 'Apectado'
//         WHEN s."Estatus" = 2 THEN 'Rechazado'
//         WHEN s."Estatus" = 3 THEN 'Cancelado'
//         ELSE '--'
//       END AS "Estatus",
//       CASE 
//         WHEN s."FechaHoraAceptacion" IS NULL THEN '--'
//         ELSE to_char(s."FechaHoraAceptacion",'dd/MM/yyyy HH24:MI:SS')
//       END AS "FechaHoraAceptacion"
//     FROM "Solicitud" s
//     INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
//     WHERE s."GCRecord" IS NULL
//     AND s."Solicitante" = '${Oid}'
//     AND to_char(s."FechaHoraVisita",'dd/MM/yyyy') = '${FechaVisita}'
//     ORDER BY s."FechaHoraVisita" DESC`;
//   return query;
// };

// export const get_ExisteSolicitante = (correo: String) => {
//   const query = `SELECT 
//         s."Oid",
//         CONCAT(s."Nombres",' ',s."PrimerApellido",' ',s."SegundoApellido") AS "NombreSolicitante",
//         s."Correo"
//       FROM "Solicitante" s
//       WHERE s."GCRecord" IS NULL 
//       AND s."Correo" = '${correo}';`;
//   return query;
// };

// export const get_Solicitante = (Oid: String) => {
//   const query = `SELECT 
//       s."Oid", 
//       CONCAT(s."Nombres",' ',s."PrimerApellido",' ',s."SegundoApellido") AS "NombreSolicitante", 
//       s."Nombres", 
//       s."PrimerApellido", 
//       s."SegundoApellido", 
//       s."Correo",
//       s."Telefono",
//       s."Mailing",
//       CASE 
//         WHEN s."FotografiaCaraSolicitanteB64" IS NOT NULL AND s."FotografiaDelanteraINEB64" IS NOT NULL AND s."FotografiaTraseraINEB64" IS NOT NULL THEN true
//         ELSE false
//       END AS "Fotos",
//       s."FotografiaCaraSolicitanteB64",
//       s."FotografiaDelanteraINEB64",
//       s."FotografiaTraseraINEB64" 
//     FROM "Solicitante" s
//     WHERE s."GCRecord" IS NULL 
//     AND s."Oid" = '${Oid}';`;
//   return query;
// };

// export const get_SolicitanteRecuperar = (Oid: String) => {
//   const query = `SELECT 
//         s."Oid",
//         CONCAT(s."Nombres",' ',s."PrimerApellido",' ',s."SegundoApellido") AS "NombreSolicitante", 
//         s."Correo" 
//       FROM "Solicitante" s
//       WHERE s."GCRecord" IS NULL
//       AND s."Oid" = '${Oid}';`;
//   return query;
// };

export const get_ConfiguracionCorreo = (Tipo: String) => {
  const query = `
          SELECT 
            cc."Oid",
            cc."TituloAceptacion",
            cc."NombreEnvia",
            cc."TextoString",
            cc."TextoBoton",
            cc."UrlDestino"
          FROM "ConfiguracionCorreo" cc
          WHERE cc."GCRecord" IS NULL
          AND cc."TipoCorreo" = ${Tipo};`;
  return query;
};

// export const all_EntidadesFederativas = `
//   SELECT 
//     ef."Oid", 
//     ef."Nombre"
//   FROM "EntidadFederativa" ef
//   WHERE ef."GCRecord" IS NULL 
//   AND ef."Activa" IS TRUE;`;

// export const all_TipoGrupo = `
//   SELECT 
//     tg."Oid", 
//     tg."Nombre", 
//     tg."OcultarCampoInstitucion"
//   FROM "TipoGrupo" tg
//   WHERE tg."GCRecord" IS NULL 
//   AND tg."Visible" IS TRUE
//   ORDER BY tg."Orden";`;

// export const get_InformacionPaginaPrincipal = `
//   SELECT 
//       ipp."Oid", 
//       ipp."Titulo",
//       ipp."Descripcion"
//   FROM "InformacionPaginaPrincipal" ipp
//   WHERE ipp."GCRecord" IS NULL 
//   and ipp."Activa" IS TRUE;`;

// export const get_HorarioVisitaDisponibles = (
//   fecha: String,
//   hora: number,
//   OidTipoVisita: String
// ) => {
//   let condicionHoy = hora > 0 ? `AND hv."HoraFin" > ${hora}` : "";
//   const query = `
//       SELECT 
//         hv."Oid",
//         hv."HoraInicio",
//         hv."HoraFin",
//         hv."HoraVisita" ,
//         count(s."Oid")
//       FROM "HorarioVisita" hv
//       INNER JOIN "CatalogoTipoVisita" ctv on ctv."Oid" = hv."TipoVisita"
//       LEFT JOIN "Solicitud" s ON s."Horario" = hv."Oid" 
//         AND (s."Estatus" != 2 OR s."Estatus" != 3 )
//         AND to_char(s."FechaHoraVisita",'yyyy-MM-dd') = '${fecha}' 
//         AND s."GCRecord" IS NULL 
//       WHERE hv."GCRecord" IS NULL
//       AND hv."Visible" IS TRUE
//       AND hv."TipoVisita" = '${OidTipoVisita}' ${condicionHoy}
//       AND s."Oid" IS NULL
//       GROUP BY hv."Oid",ctv."Oid"
//       HAVING count(s."Oid") < ctv."GruposMaxXHorario"
//       ORDER BY hv."HoraInicio";`;
//   return query;
// };
