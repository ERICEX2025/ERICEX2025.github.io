#!/usr/bin/env python3
"""
Script to add a border around an image and zoom it out
"""

from PIL import Image, ImageOps

# Configuration
INPUT_IMAGE = "images/systems@brown.png"
OUTPUT_IMAGE = "images/systems@brown.png"
BORDER_WIDTH = 50  # pixels of white space around the image
BORDER_COLOR = "white"  # background color
BORDER_LINE_WIDTH = 3  # width of the border line (set to 0 for no line)
BORDER_LINE_COLOR = "black"  # color of the border line

def add_border_and_zoom_out(input_path, output_path, padding, bg_color, line_width, line_color):
    """
    Add padding around an image and optionally add a border line

    Args:
        input_path: Path to input image
        output_path: Path to save output image
        padding: Pixels of padding to add around the image
        bg_color: Background color for the padding
        line_width: Width of border line (0 for no line)
        line_color: Color of the border line
    """
    # Open the original image
    img = Image.open(input_path)

    # Add padding (zoomed out effect)
    img_with_padding = ImageOps.expand(img, border=padding, fill=bg_color)

    # Add border line if requested
    if line_width > 0:
        img_with_padding = ImageOps.expand(img_with_padding, border=line_width, fill=line_color)

    # Save the result
    img_with_padding.save(output_path)
    print(f"✓ Processed image saved to: {output_path}")
    print(f"  Original size: {img.size}")
    print(f"  New size: {img_with_padding.size}")

if __name__ == "__main__":
    add_border_and_zoom_out(
        INPUT_IMAGE,
        OUTPUT_IMAGE,
        BORDER_WIDTH,
        BORDER_COLOR,
        BORDER_LINE_WIDTH,
        BORDER_LINE_COLOR
    )
