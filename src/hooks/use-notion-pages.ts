import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNotionAuth } from "./use-notion-auth";

export interface NotionPage {
    id: string;
    title: string;
    icon: { type: "emoji" | "url"; value: string } | null;
    cover: string | null;
    url: string;
    created_time: string;
    last_edited_time: string;
    parent_type: string;
}

export interface NotionBlock {
    id: string;
    type: string;
    [key: string]: any;
}

export const useNotionPages = () => {
    const { isConnected } = useNotionAuth();

    const {
        data: pages,
        isLoading,
        error,
        refetch,
    } = useQuery<NotionPage[], Error>({
        queryKey: ["notion-pages"],
        queryFn: async (): Promise<NotionPage[]> => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) return [];

            const { data, error } = await supabase.functions.invoke("notion-pages", {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (error) {
                console.error("Error fetching Notion pages:", error);
                return [];
            }

            return data?.pages || [];
        },
        enabled: isConnected,
        staleTime: 1000 * 60 * 5, // 5 min
        refetchOnWindowFocus: false,
    });

    const fetchPageContent = async (pageId: string): Promise<NotionBlock[]> => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) return [];

        const { data, error } = await supabase.functions.invoke(
            `notion-pages?action=content&page_id=${pageId}`,
            {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            }
        );

        if (error) {
            console.error("Error fetching page content:", error);
            return [];
        }

        return data?.blocks || [];
    };

    const updateBlock = async (blockId: string, payload: any): Promise<boolean> => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) return false;

        const { error } = await supabase.functions.invoke(
            `notion-pages?action=update-block&block_id=${blockId}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: payload,
            }
        );

        if (error) {
            console.error("Error updating block:", error);
            return false;
        }

        return true;
    };

    return {
        pages: pages || [],
        isLoading,
        isConnected,
        error,
        refetch,
        fetchPageContent,
        updateBlock,
    };
};
