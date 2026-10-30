# Recorded-session Sidebar states

## A normal: two panes

```json
{
  "viewport": [
    1680,
    1000
  ],
  "columns": [
    236,
    1108,
    336
  ],
  "columnTransition": "none",
  "expanded": true,
  "mode": "push",
  "panelContentWidth": 336,
  "panelOuterWidth": 336,
  "coversViewport": false,
  "resizeHandleWidth": 0,
  "expandedDirectories": [],
  "panes": [
    {
      "active": true,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        },
        {
          "title": "Start",
          "selected": false
        }
      ]
    },
    {
      "active": false,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        }
      ]
    }
  ]
}
```

## A manual fullscreen: underlying columns retained

```json
{
  "viewport": [
    1680,
    1000
  ],
  "columns": [
    236,
    1108,
    336
  ],
  "columnTransition": "none",
  "expanded": true,
  "mode": "fullscreen",
  "panelContentWidth": 1680,
  "panelOuterWidth": 1680,
  "coversViewport": true,
  "resizeHandleWidth": 0,
  "expandedDirectories": [],
  "panes": [
    {
      "active": true,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        },
        {
          "title": "Start",
          "selected": false
        }
      ]
    },
    {
      "active": false,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        }
      ]
    }
  ]
}
```

## A closed with manual fullscreen retained

```json
{
  "viewport": [
    1680,
    1000
  ],
  "columns": [
    236,
    1444,
    0
  ],
  "columnTransition": "none",
  "expanded": false,
  "mode": "fullscreen",
  "panelContentWidth": 0,
  "panelOuterWidth": 0,
  "coversViewport": false,
  "resizeHandleWidth": 0,
  "expandedDirectories": [],
  "panes": [
    {
      "active": true,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        },
        {
          "title": "Start",
          "selected": false
        }
      ]
    },
    {
      "active": false,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        }
      ]
    }
  ]
}
```

## B closed: independent pane and expanded workspace directory

```json
{
  "viewport": [
    1680,
    1000
  ],
  "columns": [
    236,
    1444,
    0
  ],
  "columnTransition": "grid-template-columns",
  "expanded": false,
  "mode": "push",
  "panelContentWidth": 0,
  "panelOuterWidth": 0,
  "coversViewport": false,
  "resizeHandleWidth": 0,
  "expandedDirectories": [
    "workspace"
  ],
  "panes": [
    {
      "active": true,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        }
      ]
    }
  ]
}
```

## A restored: manual fullscreen, tabs, and panes

```json
{
  "viewport": [
    1680,
    1000
  ],
  "columns": [
    236,
    1108,
    336
  ],
  "columnTransition": "none",
  "expanded": true,
  "mode": "fullscreen",
  "panelContentWidth": 1680,
  "panelOuterWidth": 1680,
  "coversViewport": true,
  "resizeHandleWidth": 0,
  "expandedDirectories": [],
  "panes": [
    {
      "active": true,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        },
        {
          "title": "Start",
          "selected": false
        }
      ]
    },
    {
      "active": false,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        }
      ]
    }
  ]
}
```

## B restored: normal mode and collapsed Files directory

```json
{
  "viewport": [
    1680,
    1000
  ],
  "columns": [
    236,
    1108,
    336
  ],
  "columnTransition": "grid-template-columns",
  "expanded": true,
  "mode": "push",
  "panelContentWidth": 336,
  "panelOuterWidth": 336,
  "coversViewport": false,
  "resizeHandleWidth": 0,
  "expandedDirectories": [],
  "panes": [
    {
      "active": true,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        }
      ]
    }
  ]
}
```

## A restored: expanded normal panel

```json
{
  "viewport": [
    1680,
    1000
  ],
  "columns": [
    236,
    1108,
    336
  ],
  "columnTransition": "grid-template-columns",
  "expanded": true,
  "mode": "push",
  "panelContentWidth": 336,
  "panelOuterWidth": 336,
  "coversViewport": false,
  "resizeHandleWidth": 0,
  "expandedDirectories": [],
  "panes": [
    {
      "active": true,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        },
        {
          "title": "Start",
          "selected": false
        }
      ]
    },
    {
      "active": false,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        }
      ]
    }
  ]
}
```

## A fixed panel at 1181px

```json
{
  "viewport": [
    1181,
    1000
  ],
  "columns": [
    236,
    609,
    336
  ],
  "columnTransition": "grid-template-columns",
  "expanded": true,
  "mode": "push",
  "panelContentWidth": 336,
  "panelOuterWidth": 336,
  "coversViewport": false,
  "resizeHandleWidth": 0,
  "expandedDirectories": [],
  "panes": [
    {
      "active": true,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        },
        {
          "title": "Start",
          "selected": false
        }
      ]
    },
    {
      "active": false,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        }
      ]
    }
  ]
}
```

## A fixed panel at 1180px

```json
{
  "viewport": [
    1180,
    1000
  ],
  "columns": [
    236,
    944,
    0
  ],
  "columnTransition": "grid-template-columns",
  "expanded": true,
  "mode": "push",
  "panelContentWidth": 336,
  "panelOuterWidth": 336,
  "coversViewport": false,
  "resizeHandleWidth": 0,
  "expandedDirectories": [],
  "panes": [
    {
      "active": true,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        },
        {
          "title": "Start",
          "selected": false
        }
      ]
    },
    {
      "active": false,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        }
      ]
    }
  ]
}
```

## A fixed panel at 1024px

```json
{
  "viewport": [
    1024,
    1000
  ],
  "columns": [
    236,
    788,
    0
  ],
  "columnTransition": "grid-template-columns",
  "expanded": true,
  "mode": "push",
  "panelContentWidth": 336,
  "panelOuterWidth": 336,
  "coversViewport": false,
  "resizeHandleWidth": 0,
  "expandedDirectories": [],
  "panes": [
    {
      "active": true,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        },
        {
          "title": "Start",
          "selected": false
        }
      ]
    },
    {
      "active": false,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        }
      ]
    }
  ]
}
```

## A fixed panel at 767px

```json
{
  "viewport": [
    767,
    1000
  ],
  "columns": [
    236,
    531,
    0
  ],
  "columnTransition": "grid-template-columns",
  "expanded": true,
  "mode": "push",
  "panelContentWidth": 336,
  "panelOuterWidth": 336,
  "coversViewport": false,
  "resizeHandleWidth": 0,
  "expandedDirectories": [],
  "panes": [
    {
      "active": true,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        },
        {
          "title": "Start",
          "selected": false
        }
      ]
    },
    {
      "active": false,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        }
      ]
    }
  ]
}
```

## A fixed panel at 390px

```json
{
  "viewport": [
    390,
    1000
  ],
  "columns": [
    236,
    154,
    0
  ],
  "columnTransition": "grid-template-columns",
  "expanded": true,
  "mode": "push",
  "panelContentWidth": 336,
  "panelOuterWidth": 336,
  "coversViewport": false,
  "resizeHandleWidth": 0,
  "expandedDirectories": [],
  "panes": [
    {
      "active": true,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        },
        {
          "title": "Start",
          "selected": false
        }
      ]
    },
    {
      "active": false,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        }
      ]
    }
  ]
}
```

## A closed: widening preserves the closed state

```json
{
  "viewport": [
    1680,
    1000
  ],
  "columns": [
    236,
    1444,
    0
  ],
  "columnTransition": "grid-template-columns",
  "expanded": false,
  "mode": "push",
  "panelContentWidth": 0,
  "panelOuterWidth": 0,
  "coversViewport": false,
  "resizeHandleWidth": 0,
  "expandedDirectories": [],
  "panes": [
    {
      "active": true,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        },
        {
          "title": "Start",
          "selected": false
        }
      ]
    },
    {
      "active": false,
      "tabs": [
        {
          "title": "Files",
          "selected": true
        }
      ]
    }
  ]
}
```
