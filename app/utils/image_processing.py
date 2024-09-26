"""import torch
from torchvision import transforms
from PIL import Image

# Load your pre-trained model here
model = torch.load('path_to_your_model.pth')
model.eval()

import torch
from torchvision import transforms
from PIL import Image

# Load your pre-trained model here
model = torch.load('path_to_your_model.pth')
model.eval()


def convert_to_cartoon(image_path):
    # Open the image using PIL
    image = Image.open(image_path)

    # Define the transformation
    transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
        transforms.Normalize((0.5,), (0.5,))
    ])

    # Apply the transformation
    image = transform(image).unsqueeze(0)

    # Generate the cartoon image
    with torch.no_grad():
        cartoon_image = model(image)

    # Post-process the output tensor
    cartoon_image = cartoon_image.squeeze().permute(1, 2, 0).numpy()
    cartoon_image = (cartoon_image * 255).astype('uint8')

    # Save the cartoon image
    cartoon_image_path = 'app/static/images/cartoon.jpg'
    Image.fromarray(cartoon_image).save(cartoon_image_path)

    return cartoon_image_path
"""