{
  "nodes": [
    {
      "parameters": {},
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [
        -1340,
        -380
      ],
      "id": "e40dae89-fe2b-4af4-bb41-f2446de4e124",
      "name": "When clicking ‘Execute workflow’"
    },
    {
      "parameters": {
        "url": "=https://www.firmy.cz/?q=ostrava{{ $json.page > 1 ? '&page=' + $json.page : '' }}\n",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        -900,
        -380
      ],
      "id": "4499c024-7ef3-4cb0-b473-078c266ffd58",
      "name": "HTTP Request"
    },
    {
      "parameters": {
        "jsCode": "const input = $input.first().json.data;\nconst regex = /https:\\/\\/www\\.firmy\\.cz\\/detail\\/[^\\s\"'<>]+?\\.html\\b/g;\nconst websites = input.match(regex);\nconst unique = [...new Set(websites)];\nreturn unique.map(website => ({ json: { website } }));"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -680,
        -380
      ],
      "id": "8ce8afdd-f5f9-47c4-bc76-081dd46069b6",
      "name": "Code"
    },
    {
      "parameters": {
        "options": {}
      },
      "type": "n8n-nodes-base.removeDuplicates",
      "typeVersion": 2,
      "position": [
        -220,
        -380
      ],
      "id": "3f129625-8e1b-4a3a-a672-dfb52f1403fc",
      "name": "Remove Duplicates"
    },
    {
      "parameters": {
        "options": {}
      },
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [
        0,
        -380
      ],
      "id": "af468bb3-384c-4f16-9a76-8da77b616e3d",
      "name": "Loop Over Items"
    },
    {
      "parameters": {
        "url": "={{ $json.website }}",
        "options": {
          "redirect": {
            "redirect": {}
          }
        }
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        460,
        -580
      ],
      "id": "a7bb84e3-9ab4-4d92-93ef-a9195ba7890e",
      "name": "HTTP Request1",
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "amount": 2
      },
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        640,
        -580
      ],
      "id": "daf7f174-df78-4643-9768-5974e0b3cfcc",
      "name": "Wait",
      "webhookId": "0c91e3f2-9ac4-4109-96ff-16c09970d775"
    },
    {
      "parameters": {
        "jsCode": "const input = $input.first().json.data;\n\n// Vytáhnout pomocí regulárních výrazů\nconst nameMatch = input.match(/<h1[^>]*class=\"[^\"]*title[^\"]*\"[^>]*>([^<]+)<\\/h1>/);\nconst websiteMatch = input.match(/<a[^>]+class=\"[^\"]*companyUrl[^\"]*\"[^>]+href=\"([^\"]+)\"/);\nconst emailMatch = input.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/);\nconst phoneMatch = input.match(/(?:\\+420)?\\s?\\d{3}[\\s.-]?\\d{3}[\\s.-]?\\d{3}/);\nconst icoMatch = input.match(/<h2[^>]*>\\s*IČO\\s*<\\/h2>\\s*<div[^>]*>(\\d{8})/);\n\nreturn [{\n  json: {\n    name: nameMatch?.[1]?.trim() ?? null,\n    website: websiteMatch?.[1]?.trim() ?? null,\n    email: emailMatch?.[0] ?? null,\n    phone: phoneMatch?.[0]?.trim() ?? null,\n    ico: icoMatch?.[1] ?? null,\n  }\n}];\n"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        820,
        -580
      ],
      "id": "f1b59a81-93d3-4519-a6f4-8a66704b2018",
      "name": "Code1",
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "jsCode": "const prevPage = $input.first()?.json.page ?? 1;\nreturn [{ json: { page: prevPage + 1 } }];\n"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -1120,
        -380
      ],
      "id": "5e15fd2d-7691-443b-9395-36f8651b0ddd",
      "name": "Code2"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "IF NOT EXISTS (SELECT 1 FROM dbo.lead WHERE email = '{{ $json.email }}') BEGIN \n  \nexecute dbo.p_zaloz_lead \n\t@obchodni_jmeno = '{{ $json.name }}',\n\t@ic = '{{ $json.ico }}',\n\t@ulice = '',\n\t@cislo_popisne = '',\n\t@cislo_orientacni = '',\n\t@mesto = '',\n\t@psc = '',\n\t@telefon = '{{ $json.phone }}',\n\t@email = '{{ $json.email }}',\n\t@www = '{{ $json.website }}',\n\t@zdroj = 'Firmy.cz', \n\t@kod_zeme = 'CZ',\n    @nazev_osloveni = 'Fimy Ostravsko'\n\n  END"
      },
      "type": "n8n-nodes-base.microsoftSql",
      "typeVersion": 1.1,
      "position": [
        1020,
        -580
      ],
      "id": "e3053814-f8df-413f-842c-27e75c137cc7",
      "name": "Microsoft SQL",
      "credentials": {
        "microsoftSql": {
          "id": "L5ByHiN770m1wa4y",
          "name": "Microsoft SQL account"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "e29648f4-219c-486f-9a6c-dc94f58c204a",
              "leftValue": "=length($items())",
              "rightValue": "0",
              "operator": {
                "type": "string",
                "operation": "equals",
                "name": "filter.operator.equals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        -460,
        -380
      ],
      "id": "5f5271e4-6794-4b17-958f-e96984223f34",
      "name": "If"
    },
    {
      "parameters": {
        "errorMessage": "Už není další stránka"
      },
      "type": "n8n-nodes-base.stopAndError",
      "typeVersion": 1,
      "position": [
        -220,
        -660
      ],
      "id": "e27dd2d7-4d72-4186-a7db-715a4da226e8",
      "name": "Stop and Error"
    },
    {
      "parameters": {},
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3.2,
      "position": [
        380,
        -120
      ],
      "id": "8b023480-81ec-4477-8e00-30e579b68e12",
      "name": "Merge"
    }
  ],
  "connections": {
    "When clicking ‘Execute workflow’": {
      "main": [
        [
          {
            "node": "Code2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "HTTP Request": {
      "main": [
        [
          {
            "node": "Code",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code": {
      "main": [
        [
          {
            "node": "If",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Remove Duplicates": {
      "main": [
        [
          {
            "node": "Loop Over Items",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Loop Over Items": {
      "main": [
        [
          {
            "node": "Merge",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "HTTP Request1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "HTTP Request1": {
      "main": [
        [
          {
            "node": "Wait",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Wait": {
      "main": [
        [
          {
            "node": "Code1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code1": {
      "main": [
        [
          {
            "node": "Microsoft SQL",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code2": {
      "main": [
        [
          {
            "node": "HTTP Request",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Microsoft SQL": {
      "main": [
        [
          {
            "node": "Loop Over Items",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "If": {
      "main": [
        [
          {
            "node": "Stop and Error",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Remove Duplicates",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Merge": {
      "main": [
        [
          {
            "node": "Code2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "meta": {
    "instanceId": "a6c4f1ab6c8ff6c5a6ad9f03e18e8266d0ee3198783dc00dbd81b1cbce5e074e"
  }
}