# Third-party software in Santra

Santra runs entirely on your PC (it only goes online to check for updates, if you allow it). It uses the following
open-source components; each keeps its own license.

| Component | Used for | License |
|---|---|---|
| [FFmpeg](https://ffmpeg.org) (gyan.dev "essentials" build, bundled as `tools\ffmpeg.exe` and `tools\ffprobe.exe`) | Audio and video conversion and editing | GPL-3.0 (this build enables GPL components). Santra runs it as a separate program. Source: https://ffmpeg.org/download.html and https://www.gyan.dev/ffmpeg/builds/ |
| [Magick.NET](https://github.com/dlemstra/Magick.NET) / ImageMagick | Image decoding, encoding, and editing | Apache-2.0 / ImageMagick License |
| [PDFsharp](https://github.com/empira/PDFsharp) 6.2.4 | Building, splitting, merging, and editing PDFs | MIT |
| [PDFtoImage](https://github.com/sungaila/PDFtoImage) + [PDFium](https://github.com/bblanchon/pdfium-binaries) | Rendering PDF pages | MIT / Apache-2.0 |
| [PdfPig](https://github.com/UglyToad/PdfPig) | Reading text from PDFs | Apache-2.0 |
| [SkiaSharp](https://github.com/mono/SkiaSharp) | Bitmap encoding for PDF rendering | MIT |
| [SharpCompress](https://github.com/adamhathcock/sharpcompress) | ZIP, TAR, GZIP, RAR, and 7z archives | MIT |
| [MetadataExtractor](https://github.com/drewnoakes/metadata-extractor-dotnet) + XmpCore | Reading image metadata | Apache-2.0 / BSD (Adobe XMP) |
| [TagLib#](https://github.com/mono/taglib-sharp) | Reading and writing audio/video tags | LGPL-2.1 (used as an unmodified, replaceable DLL) |
| [ZXing.Net](https://github.com/micjahn/ZXing.Net) | Reading QR codes and barcodes | Apache-2.0 |
| [Open XML SDK](https://github.com/dotnet/Open-XML-SDK) | Word, Excel, and PowerPoint files | MIT |
| [ClosedXML](https://github.com/ClosedXML/ClosedXML) | Spreadsheets | MIT |
| [ExcelDataReader](https://github.com/ExcelDataReader/ExcelDataReader) | Legacy .xls files | MIT |
| [Markdig](https://github.com/xoofx/markdig) | Markdown | BSD-2-Clause |
| [HtmlToOpenXml](https://github.com/onizet/html2openxml) | HTML to Word | MIT |
| [ReverseMarkdown](https://github.com/mysticmind/reversemarkdown-net) | HTML to Markdown | MIT |
| [HtmlAgilityPack](https://github.com/zzzprojects/html-agility-pack) | HTML parsing | MIT |
| [RtfPipe](https://github.com/erdomke/RtfPipe) | RTF to HTML | MIT |
| [Microsoft Edge WebView2 SDK](https://www.nuget.org/packages/Microsoft.Web.WebView2) | Rendering HTML to PDF (uses the WebView2 runtime built into Windows 11) | Microsoft WebView2 SDK license (BSD-style) |
| [Velopack](https://github.com/velopack/velopack) | The installer, uninstaller and self-updates | MIT |
| .NET 10 runtime | Application runtime | MIT |

Windows features used without extra components: Windows.Media.Ocr (text recognition), Windows.Media.FaceAnalysis (face detection), and the Windows share sheet.

Santra was inspired by [Tangerine for Mac](https://tangerineformac.com) by Leap Studio. Santra is an independent project, not affiliated with or endorsed by Leap Studio, and contains none of Tangerine's code, artwork, text, or sounds.
