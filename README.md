# flamestore

Firebase Utility Wrapper & File Generators

# Getting Started
```sh
npx flamestore
```

# Flamestore JSON Schema

- `$schema` : Json schema for flamestore.json. Set it to https://raw.githubusercontent.com/aabccd021/flamestore/master/flamestore-schema/v1.json
- `flutterOutputPath` : Relative path where flutter file generated
- `region` : Firebase region code
- `project` : Firebase project configuration. You can set multiple projects in key-value pairs with project ID as key.
- `collections`: Firestore collections definitions in key-value pairs with collection name as key.

## Collection
- `rule`:{ `get` | `list` | `create` | `update` | `delete` }`: Granular update rules for the collection. Avaliable options:
  - `all`: Allow any requests
  - `authenticated`: Allow authenticated user
  - `owner`: Allow owner of the document
  - `none`: Disallow any requests
- `ownerField`: Name of field defines owner
- `fields`: Fields definition as key-value pair with field name as key.

## Field Properties
- `property`: Field can have properties, which can be assigned as string or array. Available options:
  - `isUnique`: Field value is unique across documents in the same collections
  - `isOptional`: The field is optional
  - `isNotUpdatable`: The field is not updatable

## Field Types

### Path Field `path`
Firestore Document Reference (Path) Field
- `collection`: Name of referenced document's collection
- `syncFields`: Array or name of field synced from reference document

Example:
```json
{
  "owner": {
    "type": "path",
    "collection": "users",
    "syncField": "userName"
  }
}
```

### String Field `string`
- `minLength`: Minimum length of the string
- `maxLength`: Maximum length of the string

Example:
```json
{
  "tweetText": {
    "type": "string",
    "minLength": 1,
    "maxLength": 280
  }
}
```

### Integer Field `int`
- `min`: Minimum value of the integer
- `max`: Maximum length of the integer
- `deleteDocWhen`: The document will be deleted if the integer equals to this value

Example:
```json
{
  "likeValue": {
    "type": "int",
    "max": 5,
    "min": 0,
    "deleteDocWhen": 0
  }
}
```

### Float Field `float`
- `min`: Minimum value of the integer
- `max`: Maximum length of the integer
- `deleteDocWhen`: The document will be deleted if the integer equals to this value

Example:
```json
{
  "likeValue": {
    "type": "float",
    "max": 5,
    "min": 0,
    "deleteDocWhen": 0
  }
}
```


### Image Field `image`
- `metadata`: Array of values of image metadata name
  - `height`: Height of image
  - `width`: Width of image
  - `size`: Size of image in bytes

Example:
```json
{
  "image": {
    "type": "image",
    "metadata": [
      "height",
      "width"
    ]
  }
}
```

### Dynamic Link Field `dynamicLink`
- `title`: String of field used as dynamic link data
  - `field`: Use value of the field as dynamic link data
- `description`: String of field used as dynamic link data
  - `field`: Use value of the field as dynamic link data
- `imageURL`: String of field used as dynamic link data
  - `field`: Use value of the field as dynamic link data
- `isSuffixShort`: Use short suffix for dynamic Link

Example:
```json
{
  "dynamicLink": {
    "type": "dynamicLink",
    "isSuffixShort": true,
    "title": {
      "field": "tweetText"
    },
    "description": "tweet description"
  }
}
```


### Count Field `count`
Count certain field in documents with same reference.
- `collection`: Name of document's collection to be counted
- `reference`: Name of reference field which points to counting document

Example:
```json
{
  "tweetsCount": {
    "type": "count",
    "collection": "tweets",
    "reference": "owner"
  }
}
```


### Sum Field `sum`
Sums certain field in documents with same reference.
- `collection`: Name of document's collection to be summed
- `reference`: Name of reference field which points to summing document
- `field`: Name of field to be summed

Example:
```json
{
  "likesSum": {
    "type": "sum",
    "collection": "likes",
    "field": "likeValue",
    "reference": "tweet"
  }
}
```


### Computed Field `compute`
Computes field using custom function on firebase trigger.
- `compute`: Type of field to be computed. Available options are `int` , `float` , `string` , `timestamp` .


Example:
```json
{
  "hotness": {
    "compute": "float"
  },
}
```



### Server Timestamp Field `serverTimestamp`
Records time when document created

Example:
```json
{
  "creationTime": "serverTimestamp",
}
```


# LICENSE
MIT License

Copyright (c) 2020 Muhamad Abdurahman

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
