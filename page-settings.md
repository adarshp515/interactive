# Page Settings

This document describes the page settings available in the app.
It is divided into:
- settings available when creating pages
- settings available after pages are created

## 1. Page creation settings
These are the settings present in the initial page setup flow.

### 1.1 Format & orientation
- `Format`
  - A4, A3, A2, A1, A0, Letter, Legal, A5
  - `Custom` size is also supported.
- `Orientation`
  - `portrait`
  - `landscape`
- `Custom Dimensions`
  - `Width` in mm
  - `Height` in mm

### 1.2 Header & footer
- `Enable Header` checkbox
- `Header Height` (mm)
- `Enable Footer` checkbox
- `Footer Height` (mm)

### 1.3 Page background
- `Background Color`

### 1.4 Margins
- `Top` margin (mm)
- `Bottom` margin (mm)
- `Left` margin (mm)
- `Right` margin (mm)

### 1.5 Pages
- `Number of Pages`
  - initial page count to create
  - limited by initial modal max pages (10)

## 2. Page settings after creation
Once pages are created, the app exposes additional page settings in the page settings/modal UI.

### 2.1 Page information summary
Displayed values include:
- `Format`
- `Orientation`
- `Total Pages`
- `Dimensions` in mm
- `Margins` (top/bottom/left/right)
- `Content Area` width × height

### 2.2 Page background
- `Background Color`
  - preserved for headers, footers, and print/PDF output

### 2.3 Header settings
- `Enable Header`
- `Header Height` (mm)
- `Apply Header To`
  - `All Pages`
  - `First Page Only`
  - `Last Page Only`
  - `Even Pages Only`
  - `Odd Pages Only`
  - `Different Odd & Even Pages`
  - `Custom Range`
- `Custom Page List`
  - e.g. `1,3,5-7`

### 2.4 Footer settings
- `Enable Footer`
- `Footer Height` (mm)
- `Apply Footer To`
  - `All Pages`
  - `First Page Only`
  - `Last Page Only`
  - `Even Pages Only`
  - `Odd Pages Only`
  - `Different Odd & Even Pages`
  - `Custom Range`
- `Custom Page List`
  - e.g. `2,4-6,9`

### 2.5 Page number settings
- `Enable Page Numbers`
- `Start From Page`
- `Format`
  - `Page {n}`
  - `{n}`
  - `{n} of {total}`
  - `- {n} -`
  - `[{n}]`
- `Position`
  - `Top Left`
  - `Top Center`
  - `Top Right`
  - `Bottom Left`
  - `Bottom Center`
  - `Bottom Right`
- `Font Size`
- `Text Color`
- `Background Color`
- `Show Border`
- `Rotation`

### 2.6 Watermark settings
- `Enable Watermark`
- `Type`
  - `text`
  - `image`
  - `both`
- `Text Watermark`
  - `Text`
  - `Text Source`
    - `Static Text`
    - `JSON Key`
  - `JSON File` (when using JSON source)
  - `Data Source` / root key selection
  - `JSON Path`
  - `Font Size`
  - `Color`
  - `Opacity`
  - `Rotation`
  - `Text Position`
    - top-left, top-center, top-right, center-left, center, center-right, bottom-left, bottom-center, bottom-right
- `Image Watermark`
  - `Image URL`
  - `Upload Image`
  - `Width` (px)
  - `Height` (px)
  - `Opacity`
  - `Rotation`
  - `Image Position`
    - top-left, top-center, top-right, center-left, center, center-right, bottom-left, bottom-center, bottom-right
- `Apply to All Pages`
- `Tiled`

## 3. Page settings model structure
The app stores page setup data in a `pageSettings` object with these main fields:

- `format`
- `orientation`
- `numberOfPages`
- `width`
- `height`
- `margins`
  - `top`
  - `bottom`
  - `left`
  - `right`
- `backgroundColor`
- `pages` (array of per-page settings)
  - `id`
  - `name`
  - `pageNumber`
  - `backgroundColor`
  - `header`
  - `footer`
  - `pageNumber` (per-page page number settings)
  - `isSubreportPage`
  - `skipPageNumber`
- `headerFooter`
  - `headerEnabled`
  - `footerEnabled`
  - `headerHeight`
  - `footerHeight`
  - `headerText`
  - `footerText`
  - `headerApplyMode`
  - `footerApplyMode`
  - `headerCustomPages`
  - `footerCustomPages`
- `pageNumbering`
  - `enabled`
  - `startFromPage`
  - `excludedPages`
- `pageNumber`
  - `enabled`
  - `startFrom`
  - `format`
  - `position`
  - `fontSize`
  - `fontFamily`
  - `color`
  - `backgroundColor`
  - `showBorder`
  - `rotation`
  - `visibility`
- `watermark`
  - `enabled`
  - `type`
  - `tiled`
  - `textPosition`
  - `imagePosition`
  - `position`
  - `text`
  - `image`
  - `applyToAllPages`
- `conditionalPageBreak`
  - `enabled`
  - `defaultDistance`
  - `defaultUnit`
  - `pageOverrides`
- `sectionConditionalPageBreak`
  - `enabled`
  - `defaultDistance`
  - `defaultUnit`
  - `sectionOverrides`

## 4. Notes
- The initial page setup modal controls the first creation of pages.
- After pages exist, the page settings modal provides richer editing for headers, footers, page numbers, and watermark behavior.
- Some page settings are stored globally (`headerFooter`, `pageNumbering`, `watermark`), while per-page customizations live under each page entry in `pages`.
