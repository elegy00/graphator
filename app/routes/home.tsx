import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useLoaderData } from "react-router";
import { getAuthToken, getHomeAssistantUrl } from "../config/auth";

export const loader = async () => {

  const asd = await fetch(
     `${getHomeAssistantUrl()}/api/states/sensor.lumi_lumi_weather_c3336a05_temperature`,
    {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }
  );

  return asd.json();
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
    const data = useLoaderData<typeof loader>();
  console.log(data);
 
  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      {JSON.stringify(data)}
    </main>
  );
}
