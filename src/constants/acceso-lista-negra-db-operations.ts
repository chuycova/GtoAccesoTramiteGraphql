
export const get_ListaNegra = `
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
    --ln."CargoPersonaSolicitante" AS "Cargo",
    --cp."Nombre" AS "Cargo",
    to_char(ln."FechaBloqueo",'yyyy-MM-dd') AS "FechaBloqueo",
    ln."MotivoBloqueo",
    ln."UrlOficio",
    ln."MotivoFavor",
    ln."Activo",
    to_char(ln."FechaCreacion",'yyyy-MM-dd') AS "FechaCreacion",
    to_char(ln."FechaActualizacion",'yyyy-MM-dd') AS "FechaActualizacion"
FROM "ListaNegra" ln
LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = ln."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS NULL
LEFT JOIN "CatalogoRestriccion" cr ON cr."OID" = ln."Restriccion" AND cr."Activo" is true AND cr."GCRecord" IS NULL
--LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = ln."Cargo" AND cp."Activo" is true AND cp."GCRecord" IS NULL
WHERE ln."GCRecord" IS NULL 
AND ln."Activo" IS TRUE
ORDER BY 1;`;

export const get_ListaNegraOid = (oid: String) => {
  const query = `SELECT 
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
    --ln."CargoPersonaSolicitante" AS "Cargo",
    --cp."Nombre" AS "Cargo",
    to_char(ln."FechaBloqueo",'yyyy-MM-dd') AS "FechaBloqueo",
    ln."MotivoBloqueo",
    ln."UrlOficio",
    ln."MotivoFavor",
    ln."Activo",
    to_char(ln."FechaCreacion",'yyyy-MM-dd') AS "FechaCreacion",
    to_char(ln."FechaActualizacion",'yyyy-MM-dd') AS "FechaActualizacion"
  FROM "ListaNegra" ln
  LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = ln."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS NULL
  LEFT JOIN "CatalogoRestriccion" cr ON cr."OID" = ln."Restriccion" AND cr."Activo" is true AND cr."GCRecord" IS NULL
  --LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = ln."Cargo" AND cp."Activo" is true AND cp."GCRecord" IS NULL
  WHERE ln."GCRecord" IS NULL 
  AND ln."Oid" = '${oid}'
  AND ln."GCRecord" IS NULL 
  --AND ln."Activo" IS TRUE
  ORDER BY 1`;
  return query;
};

export const get_ListaNegraFiltro = (filtro: any,) => {
  
  let buscar =
    filtro.NombreCompleto != "" && filtro.NombreCompleto != null ? filtro.NombreCompleto : null;

  let inicio = filtro.Offset;
  let limit = filtro.Limit;

  let filter = ``;

  if (buscar != null) {
    filter += ` AND "NombreLimpio" ILIKE '%${buscar}%'`;
  }

  const query = `SELECT 
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
    ln."CargoPersonaSolicitante" AS "Cargo",
    --cp."Nombre" AS "Cargo",
    to_char(ln."FechaBloqueo",'yyyy-MM-dd') AS "FechaBloqueo",
    ln."MotivoBloqueo",
    ln."UrlOficio",
    ln."MotivoFavor",
    ln."Activo",
    to_char(ln."FechaCreacion",'yyyy-MM-dd') AS "FechaCreacion",
    to_char(ln."FechaActualizacion",'yyyy-MM-dd') AS "FechaActualizacion"
  FROM "ListaNegra" ln
  LEFT JOIN "CatalogoSexo" cs ON cs."Oid" = ln."Sexo" AND cs."Activo" is true AND cs."GCRecord" IS NULL
  LEFT JOIN "CatalogoRestriccion" cr ON cr."OID" = ln."Restriccion" AND cr."Activo" is true AND cr."GCRecord" IS NULL
  --LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = ln."Cargo" AND cp."Activo" is true AND cp."GCRecord" IS NULL
  WHERE ln."GCRecord" IS NULL 
  AND ln."Activo" IS TRUE
  ${filter}
  ORDER BY "NombreInvitado"
  OFFSET ${inicio} LIMIT ${limit}`;
  return query;
};

export const get_ListaNegraPaginado = (filtro: any,) => {
  
  let buscar =
    filtro.NombreCompleto != "" && filtro.NombreCompleto != null ? filtro.NombreCompleto : null;

  let limit = filtro.Limit;

  let filter = ``;

  if (buscar != null) {
    filter += ` AND "NombreLimpio" ILIKE '%${buscar}%'`;
  }

  const query = `SELECT 
    count(*) AS "TotalRegistros",
    ceiling(count(*)/${limit}.00) AS "Paginas"
  FROM "ListaNegra" ln
  WHERE ln."GCRecord" IS NULL 
  AND ln."Activo" IS TRUE
  ${filter}`;
  return query;
};
