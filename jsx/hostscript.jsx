// CompBuddy JSX Host Script
// This script runs in After Effects and provides the backend functionality

function selectLibraryFolder() {
    try {
        var folder = Folder.selectDialog("Select CompBuddy Library Folder");
        if (folder) {
            return folder.fsName;
        }
        return "";
    } catch (e) {
        return "Error: " + e.toString();
    }
}

function getStashedComps(libraryPath) {
    try {
        if (!libraryPath) return "[]";
        
        var libraryFolder = new Folder(libraryPath);
        if (!libraryFolder.exists) return "[]";
        
        var metadataFile = new File(libraryFolder.fsName + "/compbuddy_metadata.json");
        if (!metadataFile.exists) return "[]";
        
        metadataFile.open("r");
        var content = metadataFile.read();
        metadataFile.close();
        
        return content || "[]";
    } catch (e) {
        return "Error: " + e.toString();
    }
}

function stashSelectedComp(libraryPath, categoryName) {
    try {
        var comp = null;
        
        // First, try to get the active composition from the timeline
        if (app.project.activeItem && app.project.activeItem instanceof CompItem) {
            comp = app.project.activeItem;
        }
        // If no active comp, try to get selected composition from project panel
        else if (app.project.selection && app.project.selection.length > 0) {
            for (var i = 0; i < app.project.selection.length; i++) {
                if (app.project.selection[i] instanceof CompItem) {
                    comp = app.project.selection[i];
                    break;
                }
            }
        }
        
        if (!comp) {
            return "Error: Please select a composition in the project panel or open a composition in the timeline.";
        }
        
        var libraryFolder = new Folder(libraryPath);
        if (!libraryFolder.exists) {
            libraryFolder.create();
        }
        
        var categoryFolder = new Folder(libraryFolder.fsName + "/" + categoryName);
        if (!categoryFolder.exists) {
            categoryFolder.create();
        }
        
        // Generate unique ID with safer characters
        var timestamp = new Date().getTime();
        var randomNum = Math.floor(Math.random() * 10000);
        var uniqueId = "comp_" + timestamp + "_" + randomNum;
        
        // Create safe filename
        var safeCompName = comp.name.replace(/[<>:"|?*\\\/]/g, "_").substring(0, 50);
        var filename = safeCompName + "_" + uniqueId + ".aep";
        
        // Create file path using proper path separators
        var aepFile = new File(categoryFolder.fsName + "/" + filename);
        
        // Save current project to the library location
        var currentFile = app.project.file;
        
        try {
            app.project.save(aepFile);
            
            // If there was an original file, restore it
            if (currentFile && currentFile.exists) {
                app.project.save(currentFile);
            }
        } catch (saveError) {
            return "Error saving file: " + saveError.toString();
        }
        
        // Create thumbnail path with safe naming
        var thumbFilename = safeCompName + "_" + uniqueId + "_thumb.png";
        var thumbPath = categoryFolder.fsName + "/" + thumbFilename;
        
        // Update metadata
        var metadataFile = new File(libraryFolder.fsName + "/compbuddy_metadata.json");
        var metadata = [];
        
        if (metadataFile.exists) {
            metadataFile.open("r");
            var content = metadataFile.read();
            metadataFile.close();
            try {
                metadata = JSON.parse(content);
            } catch (e) {
                metadata = [];
            }
        }
        
        // Create ISO string manually since toISOString() isn't available in ExtendScript
        var now = new Date();
        var isoString = now.getFullYear() + "-" + 
                       ("0" + (now.getMonth() + 1)).slice(-2) + "-" + 
                       ("0" + now.getDate()).slice(-2) + "T" + 
                       ("0" + now.getHours()).slice(-2) + ":" + 
                       ("0" + now.getMinutes()).slice(-2) + ":" + 
                       ("0" + now.getSeconds()).slice(-2) + "Z";
        
        metadata.push({
            uniqueId: uniqueId,
            name: comp.name,
            category: categoryName,
            aepPath: aepFile.fsName,
            thumbPath: thumbPath,
            dateAdded: isoString
        });
        
        metadataFile.open("w");
        metadataFile.write(JSON.stringify(metadata, null, 2));
        metadataFile.close();
        
        return "Success: Composition '" + comp.name + "' added to library.";
    } catch (e) {
        return "Error: " + e.toString();
    }
}

function importComp(aepPath) {
    try {
        // Clean and validate the file path
        var cleanPath = aepPath.replace(/\\/g, "/");
        var aepFile = new File(cleanPath);
        
        if (!aepFile.exists) {
            // Try alternative path formats
            var altPath = aepPath.replace(/\//g, "\\");
            aepFile = new File(altPath);
            
            if (!aepFile.exists) {
                return "Error: Composition file not found. Path: " + aepPath;
            }
        }
        
        // Import the AEP file
        var importOptions = new ImportOptions(aepFile);
        
        // Check if we can import as project
        if (importOptions.canImportAs(ImportAsType.PROJECT)) {
            var importedItems = app.project.importFile(importOptions);
            return "Success: Composition imported successfully from " + aepFile.name;
        } else {
            // Try importing as footage if project import fails
            importOptions.importAs = ImportAsType.FOOTAGE;
            var importedItem = app.project.importFile(importOptions);
            return "Success: File imported as footage: " + aepFile.name;
        }
    } catch (e) {
        return "Error importing file: " + e.toString();
    }
}

function renameStashedComp(libraryPath, category, uniqueId, newName) {
    try {
        var metadataFile = new File(libraryPath + "/compbuddy_metadata.json");
        if (!metadataFile.exists) {
            return "Error: Metadata file not found.";
        }
        
        metadataFile.open("r");
        var content = metadataFile.read();
        metadataFile.close();
        
        var metadata = JSON.parse(content);
        
        for (var i = 0; i < metadata.length; i++) {
            if (metadata[i].uniqueId === uniqueId && metadata[i].category === category) {
                metadata[i].name = newName;
                break;
            }
        }
        
        metadataFile.open("w");
        metadataFile.write(JSON.stringify(metadata, null, 2));
        metadataFile.close();
        
        return "Success";
    } catch (e) {
        return "Error: " + e.toString();
    }
}

function deleteStashedComp(libraryPath, category, uniqueId) {
    try {
        var metadataFile = new File(libraryPath + "/compbuddy_metadata.json");
        if (!metadataFile.exists) {
            return "Error: Metadata file not found.";
        }
        
        metadataFile.open("r");
        var content = metadataFile.read();
        metadataFile.close();
        
        var metadata = JSON.parse(content);
        var compToDelete = null;
        
        for (var i = 0; i < metadata.length; i++) {
            if (metadata[i].uniqueId === uniqueId && metadata[i].category === category) {
                compToDelete = metadata[i];
                metadata.splice(i, 1);
                break;
            }
        }
        
        if (compToDelete) {
            // Delete files
            var aepFile = new File(compToDelete.aepPath);
            if (aepFile.exists) aepFile.remove();
            
            var thumbFile = new File(compToDelete.thumbPath);
            if (thumbFile.exists) thumbFile.remove();
        }
        
        metadataFile.open("w");
        metadataFile.write(JSON.stringify(metadata, null, 2));
        metadataFile.close();
        
        return "Success";
    } catch (e) {
        return "Error: " + e.toString();
    }
}