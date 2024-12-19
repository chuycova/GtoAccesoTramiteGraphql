import GMR from "graphql-merge-resolvers";
import mutationAcceso from "./acceso.mutation";
import mutationTramiteCita from "./tramite-cita.mutation";
import mutationGeneral from "./general.mutation";
import mutationAccesoGto from "./acceso-gto.mutation";

const resolversMutations = GMR.merge([
    mutationAccesoGto,
    mutationTramiteCita,
    mutationAcceso,
    mutationGeneral
]);

export default resolversMutations;
