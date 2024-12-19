import GMR from "graphql-merge-resolvers";
import typesTramiteCita from "./tramite-cita.types";
import typesAcceso from "./acceso.types";

const resolversTypes = GMR.merge([
    typesTramiteCita,
    typesAcceso
]);

export default resolversTypes;
