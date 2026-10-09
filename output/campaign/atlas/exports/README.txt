ATLAS EXPORTS

player/: standalone terrain-only SVGs with embedded raster art. No settlement labels, Nine sites, custom routes, source notes, location IDs or campaign metadata. These files are independent of play state and are safe as blank terrain bases.

dm/: standalone annotated SVGs. Editable groups separate terrain, geographic features, proposal areas, routes and labels. Contains all private preparation, including undiscovered sites; never use these as player base images. Move a label or edit its leader without moving its geographic anchor.

Atlas-Data.json is generated atlas transport. Direct edits are overwritten by a rebuild. For lasting edits, update Location-Register.json, Geography-Register.json, Route-Register.json or the atlas builder as appropriate, then run tools/build-atlas-data.py. The source registers retain stable IDs, source validation and coordinate semantics.

Native terrain image dimensions differ from the reference coordinate viewports. Every SVG uses the true reference aspect ratio and preserveAspectRatio=meet. These drawings do not establish a geographic miles-per-pixel scale.
