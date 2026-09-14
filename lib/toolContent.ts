/**
 * Long-form content for the standalone tool pages.
 *
 * These routes used to be a heading, one sentence and the widget — around 85
 * words of text each, which reads as a thin doorway page to search engines and
 * ad reviewers alike. The copy here is per-tool on purpose: a shared template
 * repeated thirteen times would just be duplicate content wearing different
 * headings.
 *
 * Everything asserted here has to stay true of the actual tool. Nothing claims
 * a feature the component doesn't have, and the privacy statements match
 * /privacy — all processing is on-device, so there is no upload to describe.
 */

export type ToolFaq = { q: string; a: string };

export type ToolContent = {
  /** Two or three sentences under the h1, replacing the old single line. */
  lede: string;
  /** How the tool is actually used, in order. */
  steps: string[];
  /** Genuinely asked questions — not padding. */
  faqs: ToolFaq[];
  /** One closing technical note, where the format has a real gotcha. */
  note?: string;
};

const ON_DEVICE =
  "Every step happens inside your browser tab using Canvas and WebAssembly. The file is never uploaded, so there is no server copy to delete and no account to create.";

export const TOOL_CONTENT: Record<string, ToolContent> = {
  "resize-image": {
    lede: "Set an exact width and height in pixels, or scale the whole image by a percentage. The aspect-ratio lock keeps the proportions intact so nothing ends up stretched, and you can switch it off when a target size demands exact dimensions.",
    steps: [
      "Choose an image from your device, or drop it straight onto the page.",
      "Enter a target width or height in pixels, or pick a percentage to scale by.",
      "Leave the aspect-ratio lock on to keep the shape, or unlock it to force exact dimensions.",
      "Download the resized file. The original on your device is left untouched.",
    ],
    faqs: [
      {
        q: "Will resizing make my image blurry?",
        a: "Making an image smaller is safe — detail is discarded but what remains stays sharp. Making it larger is not: the extra pixels have to be invented by interpolation, so an upscaled photo always looks softer than one taken at that size. As a rule, never enlarge a photo you intend to print.",
      },
      {
        q: "What is the difference between resizing by pixels and by percent?",
        a: "Pixels give you an exact result, which is what you want when a form demands, say, 600 × 600. Percent is proportional, which is easier when you just need 'half the size' across a batch of images with different starting dimensions.",
      },
      {
        q: "Does resizing change the file size too?",
        a: "Almost always yes — fewer pixels means less data to store. But dimensions and file size are separate things. If you need to hit a specific file size in kilobytes rather than specific dimensions, use the compression tool instead.",
      },
      {
        q: "Why does my image look the same size on screen after resizing?",
        a: "Browsers and image viewers scale pictures to fit the window, so a 4000px and a 800px image can appear identical on screen. Check the reported pixel dimensions rather than the on-screen size.",
      },
      {
        q: "Is my photo uploaded anywhere?",
        a: ON_DEVICE,
      },
    ],
    note: "Resizing re-encodes the image, so saving a JPEG repeatedly through several rounds of editing will slowly degrade it. Work from the original file where you can, rather than from a file you already resized.",
  },

  "crop-image": {
    lede: "Trim away the parts of a picture you don't want and keep the framing you do. Drag the crop box freely, or hold it to a fixed ratio when the result has to fit a specific shape like a square avatar or a 16:9 banner.",
    steps: [
      "Open the image you want to crop.",
      "Drag the handles to frame the area you want to keep.",
      "Pick a fixed aspect ratio if the destination requires one, or crop freehand.",
      "Download the cropped image.",
    ],
    faqs: [
      {
        q: "Does cropping reduce image quality?",
        a: "Cropping itself only discards the pixels outside your selection — the pixels you keep are unchanged. The one caveat is that saving as JPEG re-compresses the result, which introduces a small amount of loss. Saving as PNG avoids that entirely.",
      },
      {
        q: "Which aspect ratio should I use?",
        a: "1:1 for profile pictures on most social platforms, 16:9 for video thumbnails and presentation slides, 4:5 for portrait-orientation social posts, and 3:2 or 4:3 for prints. When a form or an application specifies dimensions, follow those exactly rather than guessing a ratio.",
      },
      {
        q: "Can I crop a photo for a passport or visa application here?",
        a: "This is a general-purpose crop tool, so it will not measure head height or eye line for you. Document photos are judged against precise measurements, so use the dedicated ID photo tool for those — it crops to a published government specification and checks the result.",
      },
      {
        q: "Can I undo a crop after downloading?",
        a: "Not from the downloaded file — the removed pixels are genuinely gone. Your original file is untouched on your device though, so you can always start again from it.",
      },
      {
        q: "Is my photo uploaded anywhere?",
        a: ON_DEVICE,
      },
    ],
  },

  "convert-image": {
    lede: "Move an image between JPG, PNG and WebP. Each format makes a different trade between file size, sharpness and transparency support, so the right choice depends on what the picture contains and where it is going.",
    steps: [
      "Select the image you want to convert.",
      "Choose the output format — JPG, PNG or WebP.",
      "Convert, and check the resulting file size before you commit.",
      "Download the converted file.",
    ],
    faqs: [
      {
        q: "JPG, PNG or WebP — which should I pick?",
        a: "JPG for photographs, where its lossy compression saves a lot of space with little visible cost. PNG for screenshots, logos, line art and anything needing a transparent background, because it is lossless and keeps edges crisp. WebP when you control the website it is going on — it typically beats both on size, but older software may not open it.",
      },
      {
        q: "Why did my transparent background turn white?",
        a: "JPG has no transparency channel at all, so any transparent area has to be filled with a solid colour when converting. If you need the transparency preserved, convert to PNG or WebP instead.",
      },
      {
        q: "Does converting PNG to JPG lose quality?",
        a: "Yes. PNG is lossless and JPG is not, so the conversion discards some detail permanently — usually hardest to miss on sharp edges and flat colour, such as text in a screenshot. Converting back to PNG afterwards does not restore what was lost.",
      },
      {
        q: "Why is my converted file bigger than the original?",
        a: "Usually because you converted a photograph to PNG. PNG stores every pixel exactly, which works brilliantly for graphics with flat colour but poorly for the fine noise in a camera photo. For photos, JPG or WebP will be far smaller.",
      },
      {
        q: "Is my image uploaded anywhere?",
        a: ON_DEVICE,
      },
    ],
  },

  "heic-to-jpg": {
    lede: "HEIC is the format iPhones and iPads save photos in by default. It is efficient, but plenty of websites, older Windows software and upload forms simply refuse to open it. Converting to JPG produces a file essentially everything can read.",
    steps: [
      "Choose the .heic or .heif file from your device.",
      "Wait for the decode to finish — HEIC is more work to read than JPG, so large photos take a moment.",
      "Download the converted JPG.",
    ],
    faqs: [
      {
        q: "What is a HEIC file?",
        a: "HEIC is Apple's name for an image stored using HEIF, a container built on modern video compression. It holds roughly the same visible quality as JPG in about half the space, which is why Apple made it the default. The trade is compatibility: support outside the Apple ecosystem is still patchy.",
      },
      {
        q: "Why won't a website accept my iPhone photo?",
        a: "Most likely it only accepts JPG and PNG, and your phone handed it a HEIC. Converting to JPG almost always resolves it. This is one of the most common reasons an otherwise valid photo is rejected by an upload form.",
      },
      {
        q: "Will I lose quality converting HEIC to JPG?",
        a: "There is some loss, because both formats are lossy and the image is re-encoded. In practice it is not visible for ordinary viewing, printing or uploading. What you do lose is the space saving — expect the JPG to be noticeably larger than the HEIC was.",
      },
      {
        q: "How do I stop my iPhone making HEIC files in the first place?",
        a: "In iOS, open Settings, then Camera, then Formats, and choose 'Most Compatible'. Your phone will save new photos as JPG from then on. Photos already in your library stay as they are.",
      },
      {
        q: "Are my photos uploaded anywhere?",
        a: ON_DEVICE,
      },
    ],
    note: "Live Photos are stored as a still image plus a short video. Only the still frame converts here — the motion component is not part of the resulting JPG.",
  },

  "heic-to-png": {
    lede: "Convert an iPhone or iPad HEIC photo into a PNG. PNG is lossless and universally supported, which makes it the right destination when you intend to edit the image further rather than simply view or upload it.",
    steps: [
      "Choose the .heic or .heif file from your device.",
      "Let the decode complete.",
      "Download the PNG.",
    ],
    faqs: [
      {
        q: "Should I convert HEIC to PNG or to JPG?",
        a: "PNG if the image is going into further editing, or if you need an exactly lossless copy — nothing is degraded on the way in. JPG if you simply need to view, email or upload it, since the file will be several times smaller and the difference is invisible for ordinary use.",
      },
      {
        q: "Why is the PNG so much larger than the HEIC?",
        a: "PNG records every pixel exactly rather than approximating, and photographs contain a great deal of fine detail and sensor noise. It is normal for a PNG to be many times the size of the HEIC it came from. That is the cost of being lossless.",
      },
      {
        q: "Does converting to PNG improve the image?",
        a: "No. PNG preserves exactly what it is given, but it cannot recover detail the HEIC compression already discarded. Converting to a lossless format prevents further loss; it does not undo earlier loss.",
      },
      {
        q: "Are my photos uploaded anywhere?",
        a: ON_DEVICE,
      },
    ],
  },

  "jpg-to-pdf": {
    lede: "Turn one or several JPG photos into a single PDF document. Applications, claims and submissions frequently ask for a PDF even when what you have is a photo, and combining several images into one file usually beats sending a folder of loose pictures.",
    steps: [
      "Add the JPG images you want included.",
      "Put them in the order the pages should appear.",
      "Build the PDF.",
      "Download the finished document.",
    ],
    faqs: [
      {
        q: "Can I combine several photos into one PDF?",
        a: "Yes — add as many images as you need and arrange them before building. Each image becomes its own page, in the order you set.",
      },
      {
        q: "Why does a form ask for a PDF instead of a photo?",
        a: "A PDF fixes the page layout, keeps multiple pages together as one file, and prints predictably regardless of the device. For anything with several pages — a scanned form, an ID with two sides — one PDF is far easier to handle than a set of separate images.",
      },
      {
        q: "Does converting to PDF reduce the quality of my photos?",
        a: "The images are placed into the document rather than re-drawn, so what you see in the PDF is what you put in. A PDF built from low-resolution photos will still look low-resolution — the format cannot add detail that was never captured.",
      },
      {
        q: "My PDF is too large to upload. What can I do?",
        a: "The PDF is roughly the sum of the images inside it, so shrink those first. Compress each photo, or reduce its pixel dimensions, then rebuild the PDF. A phone photo is often far larger than any document upload actually requires.",
      },
      {
        q: "Are my files uploaded anywhere?",
        a: ON_DEVICE,
      },
    ],
  },

  "png-to-pdf": {
    lede: "Combine PNG images into a single PDF. This is the usual route for screenshots, scanned documents and anything with text or sharp lines, where PNG's lossless detail is worth preserving all the way into the finished document.",
    steps: [
      "Add the PNG files you want in the document.",
      "Arrange them into the page order you want.",
      "Build the PDF.",
      "Download it.",
    ],
    faqs: [
      {
        q: "What happens to transparent areas in my PNG?",
        a: "PDF pages have no transparent background in the way a PNG does, so transparency is flattened — normally onto white — when the image is placed. If the transparent region matters to how the page looks, composite it onto the background you want before building the PDF.",
      },
      {
        q: "Is PNG or JPG better for a PDF I am going to submit?",
        a: "PNG for screenshots, scans and anything containing text, because the characters stay crisp. JPG for camera photographs, because the file will be dramatically smaller with no visible penalty. Mixing both in one document is fine.",
      },
      {
        q: "Can I control the page order?",
        a: "Yes — set the order of the images before building, and each becomes a page in that sequence.",
      },
      {
        q: "Are my files uploaded anywhere?",
        a: ON_DEVICE,
      },
    ],
  },

  "pdf-to-jpg": {
    lede: "Extract the pages of a PDF as JPG images. Useful when something will only accept an image, when you want to post a single page somewhere, or when you need a quick visual of a document without a PDF reader.",
    steps: [
      "Open the PDF you want to convert.",
      "Let the pages render.",
      "Download the pages you need as JPG images.",
    ],
    faqs: [
      {
        q: "Will the text still be selectable in the JPG?",
        a: "No. A PDF can hold real text, but a JPG is only a grid of pixels — so the words become part of the picture. If you need to select, search or copy the text, keep the PDF, or run the image through OCR software afterwards.",
      },
      {
        q: "Should I convert to JPG or PNG?",
        a: "JPG when the pages are mostly photographic, or when you need small files. PNG when the pages are mostly text, tables or diagrams, because JPG compression tends to leave faint smudging around sharp black-on-white edges.",
      },
      {
        q: "Why does my converted page look fuzzy?",
        a: "Pages are rendered at a fixed pixel size, so a dense page of small text has to fit into that many pixels. Converting to PNG helps, since it avoids adding compression artefacts on top. If the source PDF is itself a scan of a scan, no conversion will recover detail that was never there.",
      },
      {
        q: "Is my PDF uploaded anywhere?",
        a: ON_DEVICE,
      },
    ],
  },

  "pdf-to-png": {
    lede: "Turn PDF pages into PNG images. PNG is lossless, so text, tables, diagrams and fine lines stay exactly as sharp as the page was rendered — which makes it the better choice whenever the document is not primarily photographic.",
    steps: [
      "Open the PDF.",
      "Wait for the pages to render.",
      "Download the pages you want as PNG files.",
    ],
    faqs: [
      {
        q: "Why choose PNG over JPG for PDF pages?",
        a: "Because most documents are text and line art, which is exactly where JPG struggles. JPG compression leaves faint halos around sharp edges, most visible on black text against white. PNG stores the rendering exactly, so the page stays clean.",
      },
      {
        q: "The PNG files are very large. Is that expected?",
        a: "Yes, particularly for pages with photographs or heavy shading — lossless compression cannot shrink those much. If size matters more than absolute fidelity, convert those particular pages to JPG instead.",
      },
      {
        q: "Can I get the text back out of the image?",
        a: "Not from the PNG itself, which is only pixels. Keep the original PDF if you need the text, or use OCR software to read the words back out of the image.",
      },
      {
        q: "Is my PDF uploaded anywhere?",
        a: ON_DEVICE,
      },
    ],
  },

  "rotate-image": {
    lede: "Turn a picture by 90, 180 or 270 degrees, or flip it horizontally or vertically. Most often this is about fixing a photo that insists on displaying sideways even though it looked correct on the camera.",
    steps: [
      "Open the image.",
      "Rotate in 90-degree steps until it sits the right way up, or flip it to mirror it.",
      "Download the corrected image.",
    ],
    faqs: [
      {
        q: "Why does my photo appear sideways on one device but not another?",
        a: "Cameras usually record the picture in the sensor's own orientation and add an EXIF tag saying which way up it should be shown. Software that reads the tag displays it correctly; software that ignores it shows the raw, rotated version. Rotating and re-saving bakes the correct orientation into the pixels, so every viewer agrees.",
      },
      {
        q: "Does rotating lose quality?",
        a: "Turning by 90, 180 or 270 degrees simply rearranges whole pixels, so nothing is degraded by the rotation itself. If the output is a JPG, the re-encode costs a very small amount of quality — saving as PNG avoids even that.",
      },
      {
        q: "What is the difference between rotating and flipping?",
        a: "Rotating turns the image about its centre and keeps it readable. Flipping mirrors it, which reverses any text in the picture. If you are correcting an orientation problem you almost always want rotate, not flip.",
      },
      {
        q: "Is my photo uploaded anywhere?",
        a: ON_DEVICE,
      },
    ],
  },

  "watermark-image": {
    lede: "Lay text over an image before you publish it, so that copies stay traceable back to you. Position, size and transparency are adjustable, which is the balance between a mark that is hard to remove and one that does not ruin the picture.",
    steps: [
      "Open the image you want to mark.",
      "Type the watermark text — a name, a website, or a usage note.",
      "Set its position, size and opacity.",
      "Download the watermarked image.",
    ],
    faqs: [
      {
        q: "Where should I place a watermark?",
        a: "A mark in a quiet corner is tidy but trivially cropped out. One placed across the middle of the subject at low opacity is far harder to remove without damaging the image. Which you want depends on whether you are discouraging casual reuse or deterring deliberate theft.",
      },
      {
        q: "What opacity works best?",
        a: "Somewhere around 30 to 50 percent suits most images — clearly legible, but not overwhelming the picture underneath. Lighter marks look better and are easier to remove; heavier marks protect more and intrude more.",
      },
      {
        q: "Can a watermark be removed?",
        a: "Be realistic: any visible watermark can be attacked, and modern editing tools are good at it. A watermark raises the effort required and makes unattributed use obvious to viewers. It is a deterrent, not a lock — it does not replace asserting your copyright.",
      },
      {
        q: "Does watermarking change my original file?",
        a: "No. The mark is applied to a new image that you download; the file on your device is left exactly as it was.",
      },
      {
        q: "Is my image uploaded anywhere?",
        a: ON_DEVICE,
      },
    ],
  },

  "meme-generator": {
    lede: "Put caption text over an image and download the result. Straightforward top-and-bottom captions in the familiar style, without an account, a watermark stamped across your picture, or your image being posted to someone else's gallery.",
    steps: [
      "Choose the image you want to caption.",
      "Type your top and bottom text.",
      "Adjust the text until it sits where you want it.",
      "Download the finished image.",
    ],
    faqs: [
      {
        q: "Why is meme text almost always white with a black outline?",
        a: "Because it has to stay readable over an unpredictable background. A white fill with a dark outline keeps the letters legible over light and dark areas alike, which plain text in a single colour cannot manage.",
      },
      {
        q: "Will there be a watermark on my image?",
        a: "No. The downloaded image contains your picture and your caption, and nothing else added by us.",
      },
      {
        q: "Can I use any image I like?",
        a: "That depends on the image, not the tool. Photographs are owned by whoever took them, and many are licensed for limited use only. Using someone else's photo without permission can infringe copyright even when it is just a joke — safest is your own picture, or one explicitly licensed for reuse.",
      },
      {
        q: "Is my image uploaded anywhere?",
        a: ON_DEVICE,
      },
    ],
  },

  "photo-editor": {
    lede: "Make the ordinary corrections a photo usually needs, in one place and without installing anything. Aimed at quick fixes before you send or post an image, rather than at replacing a full desktop editing suite.",
    steps: [
      "Open the photo you want to work on.",
      "Apply the adjustments you need.",
      "Compare against the original as you go.",
      "Download the edited image.",
    ],
    faqs: [
      {
        q: "Is my original photo modified?",
        a: "No. Edits are applied to a copy that you download — the file on your device stays exactly as it was, so you can always go back to it.",
      },
      {
        q: "Why do my edits look different on another screen?",
        a: "Screens vary enormously in brightness, contrast and colour calibration, and phone displays in particular tend to boost saturation. If an image matters, check it on more than one device before publishing, and avoid making strong corrections on a screen set very bright or very dim.",
      },
      {
        q: "Should I edit before or after resizing?",
        a: "Edit first, at the largest size you have, then resize last. Editing a small image and then enlarging it compounds any softness — working from the most detail available gives the best result.",
      },
      {
        q: "Is my photo uploaded anywhere?",
        a: ON_DEVICE,
      },
    ],
    note: "Each save to JPG re-compresses the image. If you expect several rounds of editing, keep an intermediate copy as PNG and only export to JPG at the very end.",
  },
};
