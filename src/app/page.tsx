import { HumanEvaluationArena } from "@/components/HumanEvaluationArena";
import { WritingTypeToggle } from "@/components/WritingTypeToggle";
import { UserProfileButton } from "@/components/UserProfileButton";
import { UserScoreDisplay } from "@/components/UserScoreDisplay";
import { HelpButton } from "@/components/HelpButton";
import { Info } from "lucide-react";
import ModeCardLinks from "@/components/ModeCardLinks";

// Define a type for our data
// type VisualizationData = {
//   id: number;
//   integer_column: number | null;
//   text_column: string | null;
//   timestamp_column: string | null; // Supabase timestamps come as strings
//   created_at: string;
// };

// async function getVisualizationData() {
//   const cookieStore = cookies();
//
//   // Correct server client initialization using the new pattern from @supabase/ssr docs
//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll: async () => {
//           const store = await cookieStore;
//           return store.getAll();
//         },
//         setAll: async (cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) => {
//           try {
//             const store = await cookieStore;
//             cookiesToSet.forEach(({ name, value, options }) => {
//               store.set(name, value, options as CookieOptions);
//             });
//           } catch {
//             // console.warn("Attempted to set cookies in a Read-Only Server Component context via setAll", error);
//           }
//         },
//       },
//     }
//   );
//
//   const { data, error } = await supabase
//     .from("hf_data_visualization") // Your table name
//     .select("*")
//     .order("timestamp_column", { ascending: false }) // Example ordering
//     .limit(100); // Example limit
//
//   if (error) {
//     console.error("Error fetching visualization data:", error);
//     // Consider throwing the error or returning a more specific error object
//     return [];
//   }
//   // Assuming RLS is set up to allow reads or using service key for admin reads if needed
//   return data as VisualizationData[];
// }

export default async function Home() {
  // const vizData = await getVisualizationData();

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-4">
          <h1 className="text-2xl font-medium tracking-tight text-center sm:text-left">
            Creative Writing Evaluation Arena 📝
          </h1>
        <div className="flex items-center justify-center sm:justify-end gap-3">
          <UserScoreDisplay mode="human" />
          <HelpButton mode="human" />
          <UserProfileButton />
        </div>
      </div>

        <p className="text-sm text-muted-foreground mb-2">
          Choose an evaluation mode or jump to your stats.
        </p>
        <div className="mb-6">
          <ModeCardLinks />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sticky top-0 bg-background dark:bg-gray-950 z-10 py-2 px-1 rounded-md shadow">
          <div className="text-sm text-muted-foreground text-center sm:text-left flex items-center gap-2">
            <Info className="h-5 w-5 text-current" />
            Select the writing you think is higher quality, given the prompt.
          </div>
          <div className="flex justify-center sm:justify-end">
            <WritingTypeToggle />
          </div>
        </div>

        <HumanEvaluationArena />

        {/* <div className="mt-12 w-full">
          <h2 className="text-xl font-semibold mb-6 text-center sm:text-left">
            Hugging Face Data Visualization
          </h2>
          {vizData && vizData.length > 0 ? (
            <div className="overflow-x-auto shadow-md rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Integer Value</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Text Content</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created At</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {vizData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.integer_column === null ? 'N/A' : item.integer_column}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 break-words max-w-xs sm:max-w-md md:max-w-lg">{item.text_column}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {item.timestamp_column ? new Date(item.timestamp_column).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {vizData ? 'No data to display.' : 'Error fetching data or table is empty.'}
            </p>
          )}
        </div> */}
      </div>
    </div>
  );
}
