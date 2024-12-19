export const get_PermisionPolicyUser = (grupo: String) => {
  const query = `SELECT 
  u."Oid",
  COALESCE(u."Titulo"||' ', '')||coalesce(u."NombreCompleto",'') AS "NombreCompleto",
  u."Titulo",
  u."NombreCompleto" AS "Nombre",
  u."NombreCompletoNombreApellidos" AS "NombreCompletoPorNombre",
  u."Correo" ,
  cd."Nombre" AS "Departamento",
  cp."Nombre" AS "Posicion",
  co."Nombre" AS "Oficina",
  ce."Nombre" AS "Edificio",
  s."Nombre" AS "Sede",
  d."Titulo" AS "Dependencia",
  u."EdificioUbicacion",
  u."ExtensionTelefonica"
FROM "Usuario" u
INNER JOIN "PermissionPolicyUser" ppu ON ppu."Oid" = u."Oid"
LEFT JOIN "CatalogoDepartamento" cd ON cd."Oid" = u."Departamento" AND cd."Activo" is true AND cd."GCRecord" IS NULL
LEFT JOIN "CatalogoPosicion" cp ON cp."Oid" = u."Posicion" AND cp."Activo" is true AND cp."GCRecord" IS NULL
LEFT JOIN "CatalogoOficina" co ON co."Oid" = u."Oficina" AND co."Activo" is true AND co."GCRecord" IS NULL
LEFT JOIN "CatalogoEdificio" ce ON ce."Oid" = u."Edificio" AND ce."Activo" is true AND ce."GCRecord" IS NULL
LEFT JOIN "Dependencia" d ON d."Oid" = u."Dependencia" AND d."GCRecord" IS NULL
LEFT JOIN "SedeDependencia" sd ON sd."Oid" = u."Sede" AND sd."Visible" is true AND sd."GCRecord" IS NULL
LEFT JOIN "Sede" s ON s."Oid" = sd."Sede" AND s."Visible" is true AND s."GCRecord" IS NULL
WHERE ppu."GCRecord" IS NULL 
AND u."Grupos" ILIKE '%${grupo}%'
AND u."Visible" IS TRUE`;
  return query;
};

export const get_DiasInhabiles = `
(SELECT 
	"Oid",
	"Titulo",
	to_char("Fecha",'dd') AS "Dia",
	to_char("Fecha",'MM') AS "Mes",
	'0' AS "Anio",
	"PorAnio"
FROM "DiasInhabiles"
WHERE "PorAnio" IS false 
AND "GCRecord" IS NULL 
AND "Activo" IS TRUE)
UNION
(SELECT 
	"Oid",
	"Titulo",
	to_char("FechaAnio",'dd') AS "Dia",
	to_char("FechaAnio",'MM') AS "Mes",
	to_char("FechaAnio",'yyyy') AS "Anio",
	"PorAnio"
FROM "DiasInhabiles"
WHERE "PorAnio" IS TRUE 
AND "GCRecord" IS NULL 
AND "Activo" IS TRUE
AND "FechaAnio" BETWEEN (SELECT current_date) AND (SELECT (SELECT current_date) + interval '6 month 23 hour'));`;

export const get_Sexo = `
SELECT cs."Oid", cs."Nombre"
FROM "CatalogoSexo" cs
WHERE cs."GCRecord" IS NULL 
AND cs."Activo" IS TRUE
ORDER BY cs."Orden";`;

export const get_Cat_TIPO_VISITA = `
SELECT ctv."OID", ctv."Nombre",ctv."Activa",ctv."Descripcion"
FROM "Catalogo_TipoVisita" ctv
WHERE ctv."GCRecord" IS NULL 
AND ctv."Activa" IS TRUE
ORDER BY ctv."Orden";`;


export const getLoginAcceso = (correo: String, pass: String) => {
  const query = ` SELECT 
      ua."Oid", 
      CONCAT( ua."Nombres",' ', ua."PrimerApellido",' ', ua."SegundoApellido") AS "NombreUsuarioAcceso", 
      ua."Nombres", 
      ua."PrimerApellido", 
      ua."SegundoApellido"
    FROM "UsuarioAcceso" ua
    WHERE ua."GCRecord" IS NULL
    AND ua."Correo" = '${correo}' AND ua."Contrasenia" = '${pass}'
    AND ua."Activo" = true;`;
  return query;
};