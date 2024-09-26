import torch
from torchvision import transforms
from PIL import Image

# Load your pre-trained model here
model = torch.load('path_to_your_model.pth')
model.eval()

def convert_to_cartoon(image_path):
    image = Image.open(image_path)
    transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
        transforms.Normalize((0.5,), (0.5,))
    ])
    image = transform(image).unsqueeze(0)
    with torch.no_grad():
        cartoon_image = model(image)
    cartoon_image = cartoon_image.squeeze().permute(1, 2, 0).numpy()
    cartoon_image = (cartoon_image * 255).astype('uint8')
    cartoon_image_path = 'app/static/images/cartoon.jpg'
    Image.fromarray(cartoon_image).save(cartoon_image_path)
    return cartoon_image_path