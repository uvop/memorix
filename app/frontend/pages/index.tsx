const Home = () => {
  return null;
};

export default Home;

export const routes = {
  Home: "/",
  schema: {
    SchemaGraph: "/SchemaGraph",
  },
  platforms: {
    platformId: (id: string) => ({
      PlatformGraph: `/platforms/${id}/PlatformGraph`,
    }),
  },
  resources: {
    resourceId: (id: string) => ({
      ResourceGraph: `/resources/${id}/ResourceGraph`,
    }),
  },
  actions: {
    actionId: (id: string) => ({
      ActionGraph: `/actions/${id}/ActionGraph`,
    }),
  },
};
