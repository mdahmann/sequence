import { createClient } from "@supabase/supabase-js"
import fetch from "node:fetch"
import { parse } from "csv-parse/sync"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// CSV file URL
const csvUrl =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/poses_rows%20%283%29-LmTUMOByoN3WhbIfZQNEHbwUm0sEOY.csv"

async function importPoses() {
  try {
    console.log("Starting pose import process...")

    // Step 1: Check if poses table exists and has data
    const { data: existingPoses, error: checkError } = await supabase.from("poses").select("id").limit(1)

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking poses table:", checkError)
      return
    }

    if (existingPoses && existingPoses.length > 0) {
      console.log("Poses table already has data. Skipping import.")
      return
    }

    // Step 2: Fetch CSV data
    console.log("Fetching CSV data...")
    const response = await fetch(csvUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()

    // Step 3: Parse CSV data
    console.log("Parsing CSV data...")
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    })

    console.log(`Found ${records.length} poses to import`)

    // Step 4: Process and insert data in batches
    console.log("Importing poses...")

    // Process in batches of 50 to avoid hitting limits
    const batchSize = 50
    const batches = []

    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize))
    }

    let importedCount = 0

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} poses)...`)

      // Process each record to handle JSON fields
      const processedBatch = batch.map((record) => {
        // Convert string JSON fields to actual JSON objects
        const jsonFields = [
          "preparatory_poses",
          "transition_poses",
          "counter_poses",
          "pose_variations",
          "anatomical_focus",
          "tags",
        ]

        const processedRecord = { ...record }

        jsonFields.forEach((field) => {
          if (processedRecord[field]) {
            try {
              // If it's already a valid JSON string, parse it
              if (
                typeof processedRecord[field] === "string" &&
                (processedRecord[field].startsWith("[") || processedRecord[field].startsWith("{"))
              ) {
                processedRecord[field] = JSON.parse(processedRecord[field])
              }
              // If it's "[]", convert to empty array
              else if (processedRecord[field] === "[]") {
                processedRecord[field] = []
              }
              // Otherwise, keep as is
            } catch (e) {
              console.warn(
                `Warning: Could not parse JSON for field ${field} in pose ${processedRecord.english_name}:`,
                e,
              )
            }
          }
        })

        return processedRecord
      })

      // Insert the batch
      const { error: insertError } = await supabase.from("poses").upsert(processedBatch, { onConflict: "id" })

      if (insertError) {
        console.error(`Error inserting batch ${i + 1}:`, insertError)
      } else {
        importedCount += batch.length
        console.log(`Successfully imported batch ${i + 1} (${importedCount}/${records.length} poses)`)
      }
    }

    console.log(`Import complete! Imported ${importedCount} poses.`)

    // Verify import
    const { data: countData, error: countError } = await supabase
      .from("poses")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error verifying import:", countError)
    } else {
      console.log(`Verification: Database contains ${countData.count} poses.`)
    }
  } catch (error) {
    console.error("Error in import process:", error)
  }
}

importPoses()

