# Adaptive Grid System User Guide

## Introduction

The adaptive grid system for our news aggregator provides a flexible, intuitive way to organize your news content. This document explains how to use the natural language commands, grid layouts, and visual management tools to customize your news viewing experience.

## Key Features

- **Dynamic layouts** that adapt to your device size
- **Natural language commands** to position and resize cards
- **Visual layout management** for drag-and-drop customization
- **Layout persistence** to save your preferred arrangements
- **Reset functionality** to restore default layouts

## Getting Started

### Understanding Grid Layouts

The grid system automatically switches between different layouts based on your screen size:

- **Mobile Layout**: A single-column stack of news cards
- **Tablet Layout**: A 2x2 grid arrangement
- **Desktop Layout**: A 3x3 grid with customizable card sizes

Each card position has a name (like "Top Card" or "Main Content") that you can reference when giving commands.

### Basic Commands

You can interact with the grid using natural language commands in the chat sidebar:

| Command | Example | Action |
|---------|---------|--------|
| Move card | "Move this card to the top right" | Positions the selected card in the specified location |
| Resize card | "Make this card larger" | Changes the size of the selected card |
| Create layout | "Create a new layout called Sports Focus" | Saves the current arrangement as a named layout |
| Switch layout | "Switch to the Sports Focus layout" | Changes to a previously saved layout |
| Reset layout | "Reset the layout" | Restores the default layout settings |

## Natural Language Commands

### Moving Cards

You can move cards using intuitive position references:

- **Cardinal positions**: "top left", "bottom right", "center"
- **Named areas**: "sidebar", "main content"
- **Relative positions**: "next to the weather card", "below the headlines"

Examples:
- "Move this card to the top right"
- "Put the latest news in the main content area"
- "Place the tech news next to the weather"

### Resizing Cards

Resize commands allow you to change a card's dimensions:

Examples:
- "Make this card larger"
- "Set this card to be wider"
- "Make the sports news smaller"

### Managing Layouts

Save and switch between different arrangements:

Examples:
- "Save this layout as Morning News"
- "Switch to my Evening layout"
- "Create a compact layout"
- "Reset the layout"

## Visual Layout Manager

For more precise control, use the visual layout manager:

1. Click the "Layout" button in the top navigation
2. The layout manager will appear with the following features:
   - Grid preview showing current card positions
   - Layout controls for saving and switching layouts
   - Drag handles on each card for visual repositioning

### Drag and Drop Interface

To visually reposition cards:
1. Hover over any card to reveal the drag handle
2. Click and hold the drag handle
3. Drag the card to a new position
4. Release to place the card

### Resizing Cards Visually

To change a card's size:
1. Hover over any card to reveal the resize handles
2. Click and drag a resize handle to adjust width or height
3. Release when the card is the desired size

### Layout Presets

The layout manager includes several preset layouts:

- **News Focus**: Emphasizes main headlines with a large central card
- **Dashboard**: Equal-sized cards in a grid pattern
- **Reading Mode**: Large cards optimized for in-depth reading
- **Custom**: Your saved layouts will appear here

## Responsive Behavior

The grid system automatically adapts to different screen sizes:

- **On small screens**: Cards stack vertically in a single column
- **On medium screens**: Cards arrange in a 2x2 grid
- **On large screens**: Cards arrange in a 3x3 grid with your custom layout

When switching between screen sizes, the system preserves your card relationships when possible.

## Tips and Tricks

- **Be specific in commands**: "Move this card to top right" works better than "move card up"
- **Use card names**: Reference cards by name for more precise positioning ("Put tech news below weather")
- **Combine commands**: You can say "Move this card to the sidebar and make it taller"
- **Save layouts for different purposes**: Create separate layouts for morning news consumption, work research, leisure reading, etc.
- **Use the Help tooltip**: Click the "?" icon for a quick reference of available commands

## Command Reference Sheet

| Intent | Command Pattern | Example |
|--------|----------------|---------|
| **Move card** | "Move/put/place [the] [card reference] [to/in/at] [position]" | "Put the latest news at the top left" |
| **Resize card** | "Make/set [the] [card reference] [larger/smaller/wider/taller]" | "Make the sports news larger" |
| **Save layout** | "Save/store [this] layout [as] [name]" | "Save this layout as Evening News" |
| **Switch layout** | "Switch/change/go to [the] [layout name] layout" | "Switch to the Morning News layout" |
| **Create card** | "Create/add [a] [topic] card" | "Create a technology news card" |
| **Remove card** | "Remove/delete [the] [card reference]" | "Remove the weather card" |
| **Reset layout** | "Reset/restore [the] layout" | "Reset the layout to default" |

## Advanced Features

### Custom Layouts

// ...existing code...

### Reset Layout Functionality

If you want to revert to the default layout settings, you have several options:

1. **Using the Reset Layout button:**
   - Find the "Reset Layout" button in the Grid Layout Manager panel
   - Click the button to immediately restore all default grid layouts
   - Your layout will reset to the appropriate default based on your device size (desktop, tablet, or mobile)

2. **Using voice commands:**
   - In the chat sidebar, type "reset layout" or "reset the layout"
   - The system will restore all default grid settings
   - Any custom layouts you've saved will be removed

3. **From the NewsGrid component:**
   - Look for the "Reset Layout" button at the top of the news grid
   - Clicking this button will restore the default layout

When you reset the layout:
- All custom positions will be reset to defaults
- The system will choose the appropriate layout based on your current device width
- Any custom-saved layouts will be removed from localStorage
- Your cards will return to their default positions

This is useful when:
- Your layout becomes disorganized
- You want to start fresh with a clean arrangement
- You've created custom layouts that aren't working well
- You're experiencing any issues with card positioning

After resetting, you can rebuild your custom layouts from a clean state.

## Troubleshooting

**Problem**: Card won't move to the requested position  
**Solution**: The position might be occupied. Try specifying "next to" or "below" instead.

**Problem**: Layout doesn't save  
**Solution**: Make sure to give your layout a unique name when saving.

**Problem**: Cards overlap after resizing  
**Solution**: The system prevents overlaps. Try resizing nearby cards first to make room.

**Problem**: Command not recognized  
**Solution**: Check the command reference and try rephrasing. Be specific about what card you're referring to.

---

We hope this guide helps you get the most out of the adaptive grid system. If you have any questions or feedback, please use the "Send Feedback" option in the app menu.
