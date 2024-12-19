import { NoSqlInyection } from "../lib/RemplazarSQL";
const { v4: uuidv4 } = require('uuid');

export const get_SedeGTO = (nombreSede:any) => {
  // Expresión regular para conservar letras mayúsculas, acentuadas, y espacios
  const regex = /[^\p{Lu}\p{L} ]/gu;

  let sede = nombreSede.replace(regex, '');

  const query = `SELECT "Oid", "Nombre", "Alias","Clave", "Direccion"
  FROM "Sede"
  WHERE (
        UPPER(TRANSLATE(REGEXP_REPLACE("Nombre", '[^A-Za-zÁÉÍÓÚáéíóú ]', '', 'g'), 'ÁÉÍÓÚáéíóú', 'AEIOUaeiou')) 
        ILIKE
        '%' || UPPER(TRANSLATE('${sede}', 'ÁÉÍÓÚáéíóú', 'AEIOUaeiou')) || '%' 
        OR 
        UPPER(TRANSLATE('${sede}', 'ÁÉÍÓÚáéíóú', 'AEIOUaeiou')) 
        ILIKE
       '%' || UPPER(TRANSLATE(REGEXP_REPLACE("Alias", '[^A-Za-zÁÉÍÓÚáéíóú ]', '', 'g'), 'ÁÉÍÓÚáéíóú', 'AEIOUaeiou'))|| '%'        
        )
    AND "Clave" IS NOT NULL
    AND "Clave" != ''
  LIMIT 1;`;
  return query;
};

export const get_estacionamientoSedeGTO = (OidSede:any) => {
  const query = `SELECT "Oid","Nombre" FROM "CatalogoEstacionamiento"
  WHERE "Sede" = '${OidSede}' AND "Discapacidad" IS TRUE
  AND "GCRecord" IS NULL
  LIMIT 1;`;
  return query;
};

export const get_ObtenerEstacionamientoSedeGTO = (OidSolicitud:any,discapacidad:Boolean) => {
  let condicion = '';
  if(discapacidad)
    condicion = `AND "Discapacidad" IS TRUE`;
  else
  condicion = `AND "Predeterminado" IS TRUE`;


  const query = `SELECT "Oid","Nombre" FROM "CatalogoEstacionamiento"
  WHERE "Sede" = (SELECT s."Oid" FROM"Sede" s 
                  INNER JOIN "SedeDependencia" sd ON sd."Sede" = s."Oid" 
                  INNER JOIN "Solicitud" s2 ON s2."Sede" = sd."Oid" 
                  WHERE s2."Oid" = '${OidSolicitud}'
                  AND s."GCRecord" IS NULL)
  ${condicion}
  AND "GCRecord" IS NULL
  LIMIT 1;`;
  return query;
};

export const get_SolicitudAccesoGTO = (Oid:any) => {
  const query = `select 
    s."Oid",
    s."TipoVisita" AS "OidTipoVisita",
    ctv."Nombre" as "TipoVisita",
    i."Oid" AS "OidInvitado",
    COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "VisitaA",
    CONCAT(i."Nombres",' ',i."PrimerApellido",' ',i."SegundoApellido") AS "NombreInvitado", 
    i."Nombres",
    i."PrimerApellido",
    i."SegundoApellido",
    COALESCE(i."CURP", '') AS "CURP",
    i."FotografiaB64" as "UrlFoto",
    i."Correo" AS "CorreoInvitado",
    i."Telefono" AS "TelefonoInvitado",
    s."Sede" as "OidSede",
    se."Nombre" as "Sede",
    CASE WHEN ce."Nombre" IS NULL THEN '' ELSE ce."Nombre" END AS "Edificio",
    se."Direccion" AS "SedeDireccion",
    s."Dependencia" as "OidDependencia",
    d."Titulo" as "Dependencia",
    to_char(s."FechaHoraVisita",'dd/MM/yyyy HH24:MI:SS') AS "FechaHoraVisita",
    to_char(s."FechaHoraFinVisita",'dd/MM/yyyy HH24:MI:SS') AS "FechaHoraFinVisita",
    to_char(s."FechaHoraVisita",'dd/MM/yyyy') AS "fechaFormateada",
    to_char(s."FechaHoraVisita",'HH24:mi') AS "horaFormateada",    
    s."Estacionamiento" AS "OidTipoEstacionamiento",
    e."Nombre" AS "TipoEstacionamiento",
    e."ImagenBase64" AS "TipoEstacionamientoBase64",
    e."Discapacidad" AS "TipoEstacionamientoDeDiscapacidad",
    s."Placas",
    s."Marca" AS "MarcaVehicular",
    s."Modelo" AS "ModeloVehicular",
    s."Color" AS "ColorVehicular",
    to_char(s."FechaHoraSolicitud",'dd/MM/yyyy HH24:MI:SS') AS "FechaHoraSolicitud",
    s."ModificadoPorInvitado",
    to_char(s."FechaModificadoPorInvitado",'dd/MM/yyyy HH24:MI:SS') AS "FechaModificadoPorInvitado",
    (now()::date > s."FechaHoraVisita"::date) AS "Vencido"
  from "Solicitud" s
  inner join "Invitado" i on i."Oid" = s."Invitado" AND i."GCRecord" IS NULL
  INNER JOIN "Usuario" u ON u."Oid" = s."VisitaA"
  INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
  --LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = i."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS null
  LEFT JOIN "CatalogoEstacionamiento" e ON e."Oid" = s."Estacionamiento"
  LEFT JOIN "Catalogo_TipoVisita" ctv ON ctv."OID" = s."TipoVisita"
  LEFT JOIN "Dependencia" d ON d."Oid" = s."Dependencia"  AND d."GCRecord" IS NULL
  LEFT JOIN "SedeDependencia" sd ON sd."Oid" = s."Sede"  AND sd."GCRecord" IS NULL
  LEFT JOIN "Sede" se ON se."Oid" = sd."Sede"  AND se."GCRecord" IS NULL
  LEFT JOIN "CatalogoEdificio" ce ON ce."Oid" = u."Edificio" AND ce."Activo" is true AND ce."GCRecord" IS NULL
  where s."GCRecord" is null 
  AND s."Cancelado" IS NOT TRUE
  --AND s."ModificadoPorInvitado" IS NOT NULL
  AND s."Oid"  = '${Oid}'
  limit 1;`;
    return query;
  };
  
export const get_InvitadoXCURP = (CURP:any) => {
  const query = `SELECT "Oid" FROM "Invitado"
  WHERE "CURP" = '${CURP}'
 ;`;
  return query;
};

  
  
//---------------------------------Mutation --------------------------------//
const Oid = "(SELECT(uuid_in(overlay(overlay(md5(random()::text || ':' || clock_timestamp()::text) placing '4' from 13) placing to_hex(floor(random()*(11-8+1) + 8)::int)::text from 17)::cstring)))";
var noSqlInyection = new NoSqlInyection();
  

export const add_SolicitudCitaGTO = (solicitud:any,request:any) => {
    const query = `INSERT INTO "SolicitudGTO" 
    ("Oid", "SolicitudId","UUID","TramiteSincronizar","TramiteTipo","TramiteVentanillaNumero","TramiteHorario","TramiteUbicacion","SolicitudConCita",
    "SolicitudEsTramite","SolicitudTipo","SolicitudFecha","SolicitudFechaCita","PersonaNombre","PersonaCurp","PersonaPuesto","SolicitudUsuario",
    "SolicitudPlacaVehicular","SolicitudPlacaCheck","SolicitudCancelada","SolicitudEmail","SolicitudTelefono","SolicitudEsDiscapacitado",
    --Nuevos campos
    "Solicitud_ouuid","SucursalGuid","PersonaFotografia","SolicitudFechaCitaTermina","SolicitudTramiteNombre",
    "SolicitudVehiculoColor","SolicitudVehiculoModelo","SolicitudVehiculoMarca","DependenciaNombre","SolicitudHoraCitaInicia",
    "SolicitudHoraCitaTermina","ActualizarSolicitud","SolicitudAcompanantes","SolicitudVersion","Request",
    "FechaCreacion","Estatus",
     "OptimisticLockField","GCRecord") VALUES 
    (${Oid},
    ${solicitud.solicitudId},
    ${(solicitud.uuid == null )?'null':`'${solicitud.uuid}'`},
    ${solicitud.solicitudTramite.tramiteSincronizar},
    ${solicitud.solicitudTramite.tramiteTipo},
    ${(solicitud.solicitudTramite.tramiteVentanillaNumero == null)?'null':`'${solicitud.solicitudTramite.tramiteVentanillaNumero}'`},
    ${(solicitud.solicitudTramite.tramiteHorario == null)?'null':`'${solicitud.solicitudTramite.tramiteHorario}'`},
    ${(solicitud.solicitudTramite.tramiteUbicacion == null)?'null':`'${solicitud.solicitudTramite.tramiteUbicacion}'`},
    ${solicitud.solicitudConCita},
    ${solicitud.solicitudEsTramite},
    ${(solicitud.solicitudTipo == null)?'null':`'${solicitud.solicitudTipo}'`},
    ${(solicitud.solicitudFecha == null)?'null':`'${solicitud.solicitudFecha}'`},
    ${(solicitud.solicitudFechaCita == null)?'null':`'${solicitud.solicitudFechaCita}'`},
    ${(solicitud.personaNombre == null)?'null':`'${solicitud.personaNombre}'`},
    ${(solicitud.personaCurp == null)?'null':`'${solicitud.personaCurp}'`},
    ${(solicitud.personaPuesto == null)?'null':`'${solicitud.personaPuesto}'`},
    ${solicitud.solicitudUsuario},
    ${(solicitud.solicitudPlacaVehicular == null)?'null':`'${solicitud.solicitudPlacaVehicular}'`},
    ${solicitud.solicitudPlacaCheck},
    ${solicitud.solicitudCancelada},
    ${(solicitud.solicitudEmail == null)?'null':`'${solicitud.solicitudEmail}'`},
    ${(solicitud.solicitudTelefono == null)?'null':`'${solicitud.solicitudTelefono}'`},
    ${solicitud.solicitudEsDiscapacitado},
    ${(solicitud.ouuid == null)?'null':`'${solicitud.ouuid}'`},
    ${(solicitud.sucursalGuid == null)?'null':`'${solicitud.sucursalGuid}'`},
    ${(solicitud.personaFotografia == null)?'null':`'${solicitud.personaFotografia}'`},
    ${(solicitud.solicitudFechaCitaTermina == null)?'null':`'${solicitud.solicitudFechaCitaTermina}'`},
    ${(solicitud.solicitudTramiteNombre == null)?'null':`'${solicitud.solicitudTramiteNombre}'`},
    ${(solicitud.solicitudVehiculoColor == null)?'null':`'${solicitud.solicitudVehiculoColor}'`},
    ${(solicitud.solicitudVehiculoModelo == null)?'null':`'${solicitud.solicitudVehiculoModelo}'`},
    ${(solicitud.solicitudVehiculoMarca == null)?'null':`'${solicitud.solicitudVehiculoMarca}'`},
    ${(solicitud.dependenciaNombre == null)?'null':`'${solicitud.dependenciaNombre}'`},
    ${(solicitud.solicitudHoraCitaInicia == null)?'null':`'${solicitud.solicitudHoraCitaInicia}'`},
    ${(solicitud.solicitudHoraCitaTermina == null)?'null':`'${solicitud.solicitudHoraCitaTermina}'`},
    ${solicitud.actualizarSolicitud},
    '${solicitud.acompanantes}',
    '${solicitud.version}',
    '${request}',
    now(),0,
        1,NULL)
        RETURNING "Oid";`;
    return query;
  };
  
  
  export const add_nuevoInvitadoGTO = (inv: any) => {
    const query = `
    WITH 
    "InvitadoExists" AS (
      SELECT "Oid" FROM "Invitado" 
      WHERE "Correo" = '${inv.Correo}'
      AND ("CURP" IS NOT NULL OR "Correo" IS NOT NULL)
      AND "GCRecord" IS NULL LIMIT 1
    ),
    "InvitadoInserted" AS (
        INSERT INTO "Invitado" ("Oid","Nombres","PrimerApellido","SegundoApellido","CURP","Correo","Telefono",
            "FotografiaB64","EsPreregistro","Placa","FechaCreacion",
            "FechaBloqueo","Bloqueado","MotivoBloqueo","OptimisticLockField","GCRecord"
            ) 
            SELECT
            ${Oid},
              '${noSqlInyection.remplazar(inv.Nombres.toUpperCase())}',
              '${noSqlInyection.remplazar(inv.PrimerApellido.toUpperCase())}',
              '${noSqlInyection.remplazar(inv.SegundoApellido.toUpperCase())}',
              ${inv.CURP == null ? null : `'${inv.CURP}'`},
              ${inv.Correo == null ? null : `'${inv.Correo}'`},
              ${inv.Telefono == null ? null: `'${inv.Telefono}'`},
              ${inv.FotografiaB64 == null ? null: `'${inv.FotografiaB64}'`},
              ${inv.PreRegistro}, 
              ${inv.Placa == undefined || inv.Placa == null ? "''" : `'${inv.Placa}'`},
              (SELECT NOW()),
            NULL,FALSE,NULL,1,NULL
        WHERE NOT EXISTS (SELECT 1 FROM "InvitadoExists")
        RETURNING "Oid"
    )
    SELECT 
    (SELECT "Oid" FROM "InvitadoExists" UNION ALL SELECT  "Oid"  FROM "InvitadoInserted");
    `;
    return query;
  };
  
  export const add_nuevoDependenciaVisitaAGTO = (sedeOid:any,nombreDependencia: any,OidDependencia:string) => {
    
    const newUuidCatDependencia = uuidv4();

    const query = `
    WITH 
    "DependencaVisitaAExists" AS (
      SELECT u."Oid" FROM "Usuario" u
      INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
      WHERE UPPER(TRANSLATE(u."NombreCompleto",'ÁÉÍÓÚáéíóú','AEIOUaeiou')) = UPPER(TRANSLATE('${nombreDependencia}','ÁÉÍÓÚáéíóú','AEIOUaeiou'))
      AND ppu."GCRecord" IS NULL LIMIT 1
    ),
    "PermissionPolicyUserInserted" AS (
        INSERT INTO "PermissionPolicyUser" ("Oid","ChangePasswordOnFirstLogon","UserName","IsActive",
         "OptimisticLockField","GCRecord") 
         SELECT
            '${OidDependencia}',
            false,
            '${OidDependencia}@mail.com',
            false,
            1,NULL
        WHERE NOT EXISTS (SELECT 1 FROM "DependencaVisitaAExists")
        RETURNING "Oid"
    ),
    "UsuarioInserted" AS (
        INSERT INTO "Usuario" ("Oid","NombreCompleto","NombreCompletoLimpio","NombreCompletoNombreApellidos","NombreCompletoNombreApellidosLimpio",
          "Grupos","Visible","VisitasXDia")
          SELECT
            '${OidDependencia}',
            '${nombreDependencia}',
            TRANSLATE('${nombreDependencia}','ÁÉÍÓÚáéíóú','AEIOUaeiou'),
            '${nombreDependencia}',
            TRANSLATE('${nombreDependencia}','ÁÉÍÓÚáéíóú','AEIOUaeiou'),
            'DependenciasPorGTO',
            false,
            false
        WHERE NOT EXISTS (SELECT 1 FROM "DependencaVisitaAExists")
        RETURNING "Oid"
    ),
    "DependenciaExists" AS ( -- Catalogo de Dependencia
      SELECT d."Oid" FROM "Dependencia" d
      WHERE d."Titulo" = 'Dependencia de API para GTO'
      AND d."GCRecord" IS NULL LIMIT 1
    ),
    "DependenciaInserted" AS (
        INSERT INTO "Dependencia" ("Oid","Titulo","Activa","Orden",
         "OptimisticLockField","GCRecord") 
         SELECT
            '${newUuidCatDependencia}',
            'Dependencia de API para GTO',
            false,
            0,
            1,NULL
        WHERE NOT EXISTS (SELECT 1 FROM "DependenciaExists")
        RETURNING "Oid"
    ),
    "SedeDependenciaExists" AS ( -- Relacion de Sede con Dependencia
      SELECT sd."Oid" FROM "SedeDependencia" sd
      WHERE sd."Sede" = '${sedeOid}' AND sd."Dependencia" = (SELECT "Oid" FROM "DependenciaExists" UNION ALL SELECT  "Oid"  FROM "DependenciaInserted") 
      AND sd."GCRecord" IS NULL LIMIT 1
    ),
    "SedeDependenciaInserted" AS (
        INSERT INTO "SedeDependencia" ("Oid","Sede","Dependencia","FechaCreacion","Visible","Orden",
         "OptimisticLockField","GCRecord") 
         SELECT
            ${Oid},
            '${sedeOid}',
            (SELECT "Oid" FROM "DependenciaExists" UNION ALL SELECT  "Oid"  FROM "DependenciaInserted"),
            now(),
            false,
            0,
            1,NULL
        WHERE NOT EXISTS (SELECT 1 FROM "SedeDependenciaExists")
        RETURNING "Oid"
    )
    SELECT 
    (SELECT "Oid" FROM "DependencaVisitaAExists" 
    UNION ALL SELECT  "Oid"  FROM "PermissionPolicyUserInserted") AS "Oid",
     (SELECT "Oid" FROM "DependencaVisitaAExists" 
    UNION ALL SELECT  "Oid"  FROM "UsuarioInserted") AS "Oid2",
     (SELECT "Oid" FROM "DependenciaExists" 
    UNION ALL SELECT  "Oid"  FROM "DependenciaInserted") AS "OidDependencia",
     (SELECT "Oid" FROM "SedeDependenciaExists" 
    UNION ALL SELECT  "Oid"  FROM "SedeDependenciaInserted") AS "OidSedeDependencia";
    `;
    return query;
  };
  
  export const add_nuevaSolicitud = (solicitud:any) => {
    const query = `INSERT INTO "Solicitud" 
    ("Oid", "VisitaA", "Invitado", "Sede", "Dependencia","Asunto", "InstitucionOrigen", "Placas", "Marca", "Modelo", "Color","NoAcompaniantes",
     "Estatus","FotografiaB64", "FechaHoraVisita","FechaHoraFinVisita","Notificado",
     "PersonaVisitada","CargoPersonaVisitada","TipoVisita","IngresaEquipo","EsPreregistro","EsPrincipal","PorcentajeListaNegra","Estacionamiento",
      "FechaHoraAceptacion","FechaHoraSolicitud","ModificadoPorInvitado","RegistradoPorAPI","OptimisticLockField","GCRecord")  VALUES 
    ('${solicitud.Oid}',
      '${solicitud.VisitaA}',
      '${solicitud.Invitado}',
      '${solicitud.Sede}',
      '${solicitud.Dependencia}',
      '',
      '',
      ${solicitud.Placa == null ? `''`: `'${solicitud.Placa}'`},
      ${solicitud.Marca == null ? `''`: `'${solicitud.Marca}'`},
      ${solicitud.Modelo == null ? `''`: `'${solicitud.Modelo}'`},
      ${solicitud.Color == null ? `''`: `'${solicitud.Color}'`},
      ${solicitud.Acompanantes == "" ? `0`: `${solicitud.Acompanantes}`},
      1,
      ${solicitud.FotografiaB64 == null ? null: `'${solicitud.FotografiaB64}'`},
      '${solicitud.FechaHoraVisita}',
      '${solicitud.FechaHoraFinVisita}',
      false, 
      '',null,
      5,
      false,
      ${solicitud.PreRegistro}, 
      false,
      0,
      ${
        solicitud.TipoEstacionamiento == "" || solicitud.TipoEstacionamiento == null
          ? "null"
          : `'${solicitud.TipoEstacionamiento}'`
      },
      (SELECT now()),(SELECT now()),false,true,1,NULL)
    RETURNING "Oid";`;
    return query;
  };
  
  export const update_ResponseSolicitudCitaGTO = (solicitudOid:any,response:any,estatus:number) => {
    const query = `UPDATE "SolicitudGTO" 
    SET "Response" = '${response}',
    "Estatus" = ${estatus}
    WHERE "Oid" = '${solicitudOid}';`;
    return query;
  };
  export const update_EstatusSolicitudCitaGTO = (solicitudOid:any,estatus:number) => {
    const query = `UPDATE "SolicitudGTO" 
    SET "Estatus" = ${estatus}
    WHERE "Oid" = '${solicitudOid}';`;
    return query;
  };

  export const update_SolicitudCitaGTO = (solicitud:any,OidEstacionamiento:string) => {
    const query = `UPDATE "Solicitud" 
      SET 
        "Placas" = '${solicitud.Placa}',
        "Marca" = '${solicitud.Marca}',
        "Modelo" = '${solicitud.Modelo}',
        "Color" = '${solicitud.Color}',
        "Estacionamiento" = ${OidEstacionamiento == null ? null : `'${OidEstacionamiento}'`},
        "ModificadoPorInvitado" = true,
        "FechaModificadoPorInvitado" = (SELECT now())
      WHERE "Oid" = '${solicitud.Oid}'
      RETURNING "Oid";`;
    return query;
  };

 export const update_ModificacionSolicitudCitaGTO = (solicitudOid:any,modificacion:string) => {
  const query = `UPDATE "SolicitudGTO" 
  SET 
    "Modificado" = true,
    "Modificacion" =   COALESCE("Modificacion", '') || '\n ${modificacion}'
  WHERE "Oid" = '${solicitudOid}';`;
  return query;
};