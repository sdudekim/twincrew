import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fixed Figma file configuration
const FIGMA_CONFIG = {
  fileKey: "2pFBBAAUfwvuw0xLy7nGgJ",
};

// Channel configurations with keywords to match frame names
const CHANNEL_CONFIG = [
  { id: "criteo", name: "Criteo", keywords: ["criteo"] },
  { id: "dv360", name: "DV360", keywords: ["dv360", "dv 360", "display"] },
  { id: "social", name: "Social", keywords: ["social", "facebook", "instagram", "meta"] },
  { id: "email", name: "Email", keywords: ["email", "edm", "newsletter", "crm"] },
];

// Variable names we expect to exist/create
const EXPECTED_VARIABLES = [
  { name: "headline", displayName: "Copy_Headline" },
  { name: "subcopy", displayName: "Copy_Subcopy" },
  { name: "cta", displayName: "Copy_CTA" },
];

interface TextUpdate {
  variableName: string;
  value: string;
}

interface VariableInfo {
  id: string;
  name: string;
  resolvedType: string;
  variableCollectionId: string;
  valuesByMode: Record<string, any>;
}

interface VariableCollectionInfo {
  id: string;
  name: string;
  defaultModeId: string;
  modes: Array<{ modeId: string; name: string }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIGMA_ACCESS_TOKEN = Deno.env.get('FIGMA_ACCESS_TOKEN');
    
    if (!FIGMA_ACCESS_TOKEN) {
      throw new Error('FIGMA_ACCESS_TOKEN is not configured');
    }

    const { textUpdates, selectedChannels } = await req.json() as { 
      textUpdates: TextUpdate[]; 
      selectedChannels?: string[];
    };

    if (!textUpdates || textUpdates.length === 0) {
      throw new Error('No text updates provided');
    }

    console.log(`Updating ${textUpdates.length} text variables`);
    console.log(`Selected channels: ${selectedChannels?.join(', ') || 'all'}`);

    // Step 1: Get current local variables from Figma
    const variablesResponse = await fetch(
      `https://api.figma.com/v1/files/${FIGMA_CONFIG.fileKey}/variables/local`,
      {
        headers: {
          'X-Figma-Token': FIGMA_ACCESS_TOKEN,
        },
      }
    );

    if (!variablesResponse.ok) {
      const errorText = await variablesResponse.text();
      console.error('Failed to fetch variables:', variablesResponse.status, errorText);
      
      if (variablesResponse.status === 403) {
        throw new Error('Figma API access denied. Enterprise plan required for Variables API.');
      }
      throw new Error(`Failed to fetch Figma variables: ${variablesResponse.status}`);
    }

    const variablesData = await variablesResponse.json();
    console.log('Variables data received');

    let variables = variablesData.meta?.variables || {};
    let collections = variablesData.meta?.variableCollections || {};

    // Find "Copy" collection (or create if not exists)
    let copyCollection: VariableCollectionInfo | null = null;
    let copyCollectionId: string | null = null;

    for (const [id, collection] of Object.entries(collections)) {
      const col = collection as VariableCollectionInfo;
      if (col.name.toLowerCase().includes('copy') || col.name.toLowerCase().includes('text')) {
        copyCollection = col;
        copyCollectionId = id;
        console.log(`Found existing collection: ${col.name} (${id}) with ${col.modes.length} modes`);
        break;
      }
    }

    // Check which channel modes need to be targeted
    const targetChannels = selectedChannels && selectedChannels.length > 0 
      ? selectedChannels 
      : CHANNEL_CONFIG.map(c => c.id); // If no channels selected, update all

    console.log(`Target channels for update: ${targetChannels.join(', ')}`);

    // Find existing variables
    const existingVariables: Map<string, VariableInfo> = new Map();
    const variablesToCreate: Array<{ name: string; searchName: string }> = [];

    for (const expected of EXPECTED_VARIABLES) {
      let found = false;
      for (const [id, variable] of Object.entries(variables)) {
        const v = variable as VariableInfo;
        const varNameLower = v.name.toLowerCase();
        if (v.resolvedType === 'STRING' && 
            (varNameLower.includes(expected.name.toLowerCase()) || 
             varNameLower.includes(expected.displayName.toLowerCase()))) {
          existingVariables.set(expected.name, { ...v, id });
          found = true;
          console.log(`Found existing variable: ${v.name} (${id})`);
          break;
        }
      }
      if (!found) {
        variablesToCreate.push({ name: expected.displayName, searchName: expected.name });
      }
    }

    // Create collection and/or variables if needed
    if (!copyCollectionId || variablesToCreate.length > 0) {
      console.log(`Need to create: collection=${!copyCollectionId}, variables=${variablesToCreate.length}`);

      const createPayload: any = {
        variableModeValues: []
      };

      // Create collection if not exists
      if (!copyCollectionId) {
        console.log('Creating new Copy collection with channel modes');
        createPayload.variableCollections = [{
          action: "CREATE",
          id: "temp_collection_id",
          name: "Copy",
          initialModeId: "temp_mode_default"
        }];
        copyCollectionId = "temp_collection_id";
      }

      // Create variables if any missing
      if (variablesToCreate.length > 0) {
        const updateToValueMap = new Map<string, string>();
        for (const update of textUpdates) {
          updateToValueMap.set(update.variableName.toLowerCase(), update.value);
        }

        createPayload.variables = variablesToCreate.map((v, index) => ({
          action: "CREATE",
          id: `temp_var_${index}`,
          name: v.name,
          resolvedType: "STRING",
          variableCollectionId: copyCollectionId
        }));

        // Set initial value for default mode
        createPayload.variableModeValues = variablesToCreate.map((v, index) => ({
          variableId: `temp_var_${index}`,
          modeId: copyCollection?.defaultModeId || "temp_mode_default",
          value: updateToValueMap.get(v.searchName.toLowerCase()) || ""
        }));
      }

      console.log('Create payload:', JSON.stringify(createPayload, null, 2));

      const createResponse = await fetch(
        `https://api.figma.com/v1/files/${FIGMA_CONFIG.fileKey}/variables`,
        {
          method: 'POST',
          headers: {
            'X-Figma-Token': FIGMA_ACCESS_TOKEN,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createPayload),
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('Failed to create:', createResponse.status, errorText);
        throw new Error(`Failed to create Figma variables: ${createResponse.status}`);
      }

      const createResult = await createResponse.json();
      console.log('Created successfully');

      // Map temp IDs to real IDs
      const tempIdToRealId = createResult.meta?.tempIdToRealId || createResult.tempIdToRealId || {};
      
      for (let i = 0; i < variablesToCreate.length; i++) {
        const realId = tempIdToRealId[`temp_var_${i}`];
        if (realId) {
          existingVariables.set(variablesToCreate[i].searchName, {
            id: realId,
            name: variablesToCreate[i].name,
            resolvedType: 'STRING',
            variableCollectionId: tempIdToRealId['temp_collection_id'] || copyCollectionId!,
            valuesByMode: {}
          });
        }
      }

      // Update collection ID if created
      if (tempIdToRealId['temp_collection_id']) {
        copyCollectionId = tempIdToRealId['temp_collection_id'];
      }

      // Refetch collection info
      const refetchResponse = await fetch(
        `https://api.figma.com/v1/files/${FIGMA_CONFIG.fileKey}/variables/local`,
        { headers: { 'X-Figma-Token': FIGMA_ACCESS_TOKEN } }
      );
      if (refetchResponse.ok) {
        const refetchData = await refetchResponse.json();
        collections = refetchData.meta?.variableCollections || {};
        copyCollection = collections[copyCollectionId!] as VariableCollectionInfo || null;
      }
    }

    if (!copyCollection) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Could not find or create Copy collection'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get modes from collection
    const modes = copyCollection.modes || [];
    console.log(`Collection has ${modes.length} modes: ${modes.map(m => m.name).join(', ')}`);

    // Find modes that match selected channels
    const targetModeIds: string[] = [];
    for (const channelId of targetChannels) {
      const channelConfig = CHANNEL_CONFIG.find(c => c.id === channelId);
      if (!channelConfig) continue;

      // Find mode matching this channel
      for (const mode of modes) {
        const modeNameLower = mode.name.toLowerCase();
        if (channelConfig.keywords.some(kw => modeNameLower.includes(kw.toLowerCase()))) {
          targetModeIds.push(mode.modeId);
          console.log(`Channel ${channelId} matched mode: ${mode.name} (${mode.modeId})`);
          break;
        }
      }
    }

    // If no specific modes found, use default mode
    if (targetModeIds.length === 0) {
      console.log(`No specific modes found for channels, using default mode`);
      targetModeIds.push(copyCollection.defaultModeId);
    }

    // Build variable mode values for update
    const variableModeValues: Array<{ variableId: string; modeId: string; value: string }> = [];

    for (const update of textUpdates) {
      const varInfo = existingVariables.get(update.variableName.toLowerCase());
      if (varInfo) {
        // Update for each target mode
        for (const modeId of targetModeIds) {
          variableModeValues.push({
            variableId: varInfo.id,
            modeId: modeId,
            value: update.value
          });
          console.log(`Will update ${varInfo.name} in mode ${modeId} -> "${update.value}"`);
        }
      }
    }

    if (variableModeValues.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No variables to update',
        existingVariables: Array.from(existingVariables.entries()).map(([k, v]) => ({ key: k, name: v.name, id: v.id })),
        modes: modes.map(m => ({ name: m.name, id: m.modeId }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update the variables
    console.log(`Updating ${variableModeValues.length} variable-mode combinations`);

    const updateResponse = await fetch(
      `https://api.figma.com/v1/files/${FIGMA_CONFIG.fileKey}/variables`,
      {
        method: 'POST',
        headers: {
          'X-Figma-Token': FIGMA_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variableModeValues: variableModeValues
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update:', updateResponse.status, errorText);
      throw new Error(`Failed to update Figma variables: ${updateResponse.status}`);
    }

    const updateResult = await updateResponse.json();
    console.log('Variables updated successfully');

    return new Response(JSON.stringify({
      success: true,
      updatedCount: variableModeValues.length,
      targetChannels: targetChannels,
      targetModes: targetModeIds.length,
      updates: variableModeValues.map(v => ({
        variableId: v.variableId,
        modeId: v.modeId,
        newValue: v.value
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in yumi-figma-update-text:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
