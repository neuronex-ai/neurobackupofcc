import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define types
interface NotionBlock {
    id: string;
    type: string;
    has_children: boolean;
    children?: NotionBlock[];
    [key: string]: any;
}

interface NotionPage {
    id: string;
    url: string;
    last_edited_time: string;
    properties: Record<string, any>;
    icon: { type: string; emoji?: string; file?: { url: string }; external?: { url: string } } | null;
    cover: { file?: { url: string }; external?: { url: string } } | null;
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseService = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Get user from auth header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Missing Authorization header");

        const { data: { user }, error: authError } = await supabaseService.auth.getUser(authHeader.replace("Bearer ", ""));
        if (authError || !user) throw new Error("Unauthorized");

        // Get notion token
        const { data: tokenData, error: tokenError } = await supabaseService
            .from("user_notion_tokens")
            .select("access_token")
            .eq("user_id", user.id)
            .single();

        if (tokenError || !tokenData) throw new Error("Notion not connected");

        const notionToken = tokenData.access_token;
        const url = new URL(req.url);
        const action = url.searchParams.get("action");

        if (action === "content") {
            const pageId = url.searchParams.get("page_id");
            if (!pageId) throw new Error("Missing page_id");

            // Fetch blocks
            const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
                headers: {
                    "Authorization": `Bearer ${notionToken}`,
                    "Notion-Version": "2022-06-28",
                },
            });
            const data = await response.json();

            // Recursively fetch children for certain block types (like columns)
            const blocks = await Promise.all(data.results.map(async (block: NotionBlock) => {
                if (block.has_children && (block.type === 'column_list' || block.type === 'column' || block.type === 'toggle')) {
                    const childResponse = await fetch(`https://api.notion.com/v1/blocks/${block.id}/children`, {
                        headers: {
                            "Authorization": `Bearer ${notionToken}`,
                            "Notion-Version": "2022-06-28",
                        },
                    });
                    const childData = await childResponse.json();
                    block.children = childData.results;
                }
                return block;
            }));

            return new Response(JSON.stringify({ blocks }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (action === "update-block") {
            const blockId = url.searchParams.get("block_id");
            const payload = await req.json();

            const response = await fetch(`https://api.notion.com/v1/blocks/${blockId}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${notionToken}`,
                    "Notion-Version": "2022-06-28",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Default action: list pages
        const response = await fetch("https://api.notion.com/v1/search", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${notionToken}`,
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                filter: { property: "object", value: "page" },
                sort: { direction: "descending", timestamp: "last_edited_time" },
            }),
        });

        const searchData = await response.json();
        const pages = searchData.results.map((page: NotionPage) => ({
            id: page.id,
            title: page.properties?.title?.title?.[0]?.plain_text ||
                page.properties?.Name?.title?.[0]?.plain_text ||
                "Untitled",
            icon: page.icon ? {
                type: page.icon.type,
                value: page.icon.type === 'emoji' ? page.icon.emoji : page.icon.file?.url || page.icon.external?.url
            } : null,
            cover: page.cover?.external?.url || page.cover?.file?.url || null,
            url: page.url,
            last_edited_time: page.last_edited_time,
        }));

        return new Response(JSON.stringify({ pages }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
