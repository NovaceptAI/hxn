# Animals Folder

Place your 6 animal PNG images here with transparent backgrounds:

- `animal1.png` - First animal (appears on first "No" dodge)
- `animal2.png` - Second animal
- `animal3.png` - Third animal
- `animal4.png` - Fourth animal
- `animal5.png` - Fifth animal
- `animal6.png` - Sixth animal

**Image specs:**
- Format: PNG with transparent background
- Size: ~80-120px width
- Animals should "point" or face toward center
- Examples: dog, cat, bunny, bird, bear, fox

**To use images instead of emojis:**

In [app/page.tsx](../app/page.tsx), find this comment and uncomment the image line:

```tsx
{/* Replace with <img src={`/animals/animal${animalIndex + 1}.png`} /> when you have images */}
<span className="text-4xl filter drop-shadow-lg">
  {animalEmojis[animalIndex]}
</span>
```

Change to:

```tsx
<img 
  src={`/animals/animal${animalIndex + 1}.png`}
  alt={`Animal ${animalIndex + 1}`}
  className="w-20 h-20 object-contain filter drop-shadow-lg"
/>
```

The animals will appear one by one around the "Yes" button each time someone tries to click "No"!
