const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

// upload shapefile zip
app.post("/upload", upload.single("file"), (req, res) => {
    const zipPath = req.file.path;
    const outputDir = "output/" + req.file.filename;

    fs.mkdirSync(outputDir, { recursive: true });

    // unzip
    exec(`unzip ${zipPath} -d ${outputDir}`, (err) => {
        if (err) return res.send("Грешка при unzip");

        // намираме shp файла
        const shpFile = fs.readdirSync(outputDir).find(f => f.endsWith(".shp"));

        if (!shpFile) return res.send("Няма SHP файл");

        const shpPath = path.join(outputDir, shpFile);
        const kmlPath = path.join(outputDir, "result.kml");

        // GDAL конверсия
        exec(`ogr2ogr -f KML ${kmlPath} ${shpPath}`, (err) => {
            if (err) return res.send("GDAL грешка");

            res.json({
                success: true,
                kml: kmlPath
            });
        });
    });
});

app.use("/files", express.static("output"));

app.listen(3000, () => console.log("Server started"));