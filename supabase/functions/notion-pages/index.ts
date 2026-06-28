import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NOTION_VERSION = "2022-06-28";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotionBlock {
  id: string;
  type: string;
  has_children?: boolean;
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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const richTextPlain = (richText: any[] = []) =>
  richText.map((part) => part?.plain_text || "").join("");

const richTextHtml = (richText: any[] = []) =>
  richText
    .map((part) => {
      let value = escapeHtml(part?.plain_text || "");
      const annotations = part?.annotations || {};

      if (annotations.code) value = `<code>${value}</code>`;
      if (annotations.bold) value = `<strong>${value}</strong>`;
      if (annotations.italic) value = `<em>${value}</em>`;
      if (annotations.underline) value = `<u>${value}</u>`;
      if (annotations.strikethrough) value = `<s>${value}</s>`;
      if (part?.href) value = `<a href="${escapeHtml(part.href)}" target="_blank" rel="noopener noreferrer">${value}</a>`;

      return value;
    })
    .join("");

const notionRequest = async (token: string, path: string, init: RequestInit = {}) => {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || `Notion API error: ${response.status}`);
  }

  return data;
};

const getPageTitle = (page: NotionPage) => {
  const titleProperty = Object.values(page.properties || {}).find((property: any) => property?.type === "title") as any;
  return richTextPlain(titleProperty?.title).trim() || "Página do Notion";
};

const getPageIcon = (page: NotionPage) =>
  page.icon
    ? {
        type: page.icon.type,
        value: page.icon.type === "emoji" ? page.icon.emoji : page.icon.file?.url || page.icon.external?.url,
      }
    : null;

const fetchBlockChildren = async (token: string, blockId: string, depth = 0): Promise<NotionBlock[]> => {
  const blocks: NotionBlock[] = [];
  let cursor: string | null = null;

  do {
    const query = new URLSearchParams({ page_size: "100" });
    if (cursor) query.set("start_cursor", cursor);

    const data = await notionRequest(token, `/blocks/${blockId}/children?${query.toString()}`);
    const results = (data.results || []) as NotionBlock[];

    for (const block of results) {
      if (block.has_children && depth < 3) {
        block.children = await fetchBlockChildren(token, block.id, depth + 1);
      }
      blocks.push(block);
    }

    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);

  return blocks;
};

const renderChildren = (block: NotionBlock) =>
  block.children?.length ? `<div>${renderBlocks(block.children)}</div>` : "";

const renderBlock = (block: NotionBlock): string => {
  const type = block.type;
  const data = block[type] || {};
  const text = richTextHtml(data.rich_text || data.title || []);
  const children = renderChildren(block);

  switch (type) {
    case "heading_1":
      return `<h1>${text}</h1>${children}`;
    case "heading_2":
      return `<h2>${text}</h2>${children}`;
    case "heading_3":
      return `<h3>${text}</h3>${children}`;
    case "bulleted_list_item":
      return `<ul><li>${text}${children}</li></ul>`;
    case "numbered_list_item":
      return `<ol><li>${text}${children}</li></ol>`;
    case "to_do":
      return `<p>${data.checked ? "☑" : "☐"} ${text}</p>${children}`;
    case "quote":
      return `<blockquote>${text}</blockquote>${children}`;
    case "code":
      return `<pre><code>${escapeHtml(richTextPlain(data.rich_text || []))}</code></pre>`;
    case "divider":
      return "<hr />";
    case "callout":
      return `<blockquote>${text}</blockquote>${children}`;
    case "image": {
      const url = data.file?.url || data.external?.url;
      return url ? `<p><img src="${escapeHtml(url)}" alt="" /></p>` : "";
    }
    case "paragraph":
    default:
      return text || children ? `<p>${text}</p>${children}` : "";
  }
};

const renderBlocks = (blocks: NotionBlock[]) => blocks.map(renderBlock).filter(Boolean).join("\n");

const shouldIgnoreMissingTable = (error: any) =>
  error?.code === "42P01" || String(error?.message || "").toLowerCase().includes("does not exist");

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const {
      data: { user },
      error: authError,
    } = await supabaseService.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) throw new Error("Unauthorized");

    const { data: tokenData, error: tokenError } = await supabaseService
      .from("user_notion_tokens")
      .select("access_token, workspace_id")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenData) throw new Error("Notion not connected");

    const notionToken = tokenData.access_token;
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "content") {
      const pageId = url.searchParams.get("page_id");
      if (!pageId) throw new Error("Missing page_id");

      const blocks = await fetchBlockChildren(notionToken, pageId, 0);
      return json({ blocks });
    }

    if (action === "update-block") {
      const blockId = url.searchParams.get("block_id");
      if (!blockId) throw new Error("Missing block_id");

      const payload = await req.json();
      const data = await notionRequest(notionToken, `/blocks/${blockId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      return json(data);
    }

    if (action === "import-page") {
      const body = await req.json().catch(() => ({}));
      const pageId = body.page_id || body.pageId || url.searchParams.get("page_id");
      if (!pageId) throw new Error("Missing page_id");

      const page = (await notionRequest(notionToken, `/pages/${pageId}`)) as NotionPage;
      const blocks = await fetchBlockChildren(notionToken, pageId, 0);
      const title = getPageTitle(page);
      const renderedBlocks = renderBlocks(blocks);
      const sourceUrl = page.url || null;
      const importedAt = new Date().toISOString();
      const content = [
        `<p><strong>Origem:</strong> ${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Notion</a>` : "Notion"}</p>`,
        renderedBlocks || "<p>Esta página não possui conteúdo visível no Notion.</p>",
      ].join("\n");

      const { data: existingImport, error: existingImportError } = await supabaseService
        .from("notion_imports")
        .select("id, note_id")
        .eq("user_id", user.id)
        .eq("notion_page_id", pageId)
        .maybeSingle();

      if (existingImportError && !shouldIgnoreMissingTable(existingImportError)) {
        throw existingImportError;
      }

      const notePayload = {
        user_id: user.id,
        patient_id: null,
        module_id: null,
        title,
        content,
        tags: ["notion", "importado"],
        reference_date: page.last_edited_time || importedAt,
        updated_at: importedAt,
      };

      const noteQuery = existingImport?.note_id
        ? supabaseService
            .from("personal_notes")
            .update(notePayload)
            .eq("id", existingImport.note_id)
            .eq("user_id", user.id)
        : supabaseService.from("personal_notes").insert(notePayload);

      const { data: note, error: noteError } = await noteQuery
        .select("id, title, content, updated_at")
        .single();

      if (noteError) throw noteError;

      const { error: importError } = await supabaseService
        .from("notion_imports")
        .upsert(
          {
            user_id: user.id,
            workspace_id: tokenData.workspace_id || null,
            notion_page_id: pageId,
            note_id: note.id,
            title,
            source_url: sourceUrl,
            last_edited_time: page.last_edited_time || null,
            imported_at: importedAt,
            updated_at: importedAt,
          },
          { onConflict: "user_id,notion_page_id" }
        );

      if (importError && !shouldIgnoreMissingTable(importError)) {
        throw importError;
      }

      return json({
        note,
        created: !existingImport?.note_id,
        source: {
          page_id: pageId,
          title,
          url: sourceUrl,
          last_edited_time: page.last_edited_time || null,
        },
      });
    }

    const searchData = await notionRequest(notionToken, "/search", {
      method: "POST",
      body: JSON.stringify({
        filter: { property: "object", value: "page" },
        sort: { direction: "descending", timestamp: "last_edited_time" },
      }),
    });

    const pages = (searchData.results || []).map((page: NotionPage) => ({
      id: page.id,
      title: getPageTitle(page),
      icon: getPageIcon(page),
      cover: page.cover?.external?.url || page.cover?.file?.url || null,
      url: page.url,
      last_edited_time: page.last_edited_time,
      parent_type: (page as any).parent?.type || "workspace",
    }));

    return json({ pages });
  } catch (error) {
    return json({ error: (error as Error).message }, 400);
  }
});
