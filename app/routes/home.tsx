import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useLoaderData } from "react-router";
import { getAuthToken, getHomeAssistantUrl } from "../config/auth";

export const loader = async () => {
  try {
    const url = `${getHomeAssistantUrl()}/api/states/sensor.lumi_lumi_weather_c3336a05_temperature`;
    console.log('Fetching from:', url);
    console.log('Using token:', getAuthToken()?.substring(0, 20) + '...');
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const text = await response.text();
      console.error('API Error:', text);
      return { 
        error: true, 
        status: response.status,
        message: text.substring(0, 200),
        url 
      };
    }

    const data = await response.json();
    console.log('Success:', data);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    return { 
      error: true, 
      message: error instanceof Error ? error.message : 'Unknown error',
      url: getHomeAssistantUrl() 
    };
  }
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
      <div className="p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Sensor Data</h1>
        {(data as any)?.error ? (
          <div className="text-red-600 dark:text-red-400">
            <p className="font-bold">Error fetching data:</p>
            <pre className="mt-2 text-sm overflow-auto">{JSON.stringify(data, null, 2)}</pre>
          </div>
        ) : (
          <pre className="overflow-auto">{JSON.stringify(data, null, 2)}</pre>
        )}
      </div>
    </main>
  );
}
