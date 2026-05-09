from PIL import Image
import sys
import math

def remove_background(input_path, output_path, tolerance=30):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    # Get the background color from the top-left pixel
    bg_r, bg_g, bg_b, _ = data[0]
    
    new_data = []
    for item in data:
        r, g, b, a = item
        # Calculate distance
        dist = math.sqrt((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2)
        if dist <= tolerance:
            new_data.append((255, 255, 255, 0)) # Transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

if __name__ == "__main__":
    remove_background(sys.argv[1], sys.argv[2])
