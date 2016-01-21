# Transformer

Transformer is a tool to convert data from one format to another.
It uses a **mapping** file to declare how this transformation should take place.
After conversion, each **entity** is checked against a **schema** and if it doesn't validate, it is sent to the user to allow him or her to revise it so it matches, or reject it altogether.

## Table of Contents
- [Installation](#installation)
  - [Installing git](#installing-git)
  - [Installing nodejs](#installing-nodejs)
  - [Installing transformer](#installing-transformer)
- [Converting your file](#converting-your-file)
  - [Understanding input/output formats](#understanding-input/output-formats)
    - [Your source file](#your-source-file)
    - [Your destination files and the schema](#your-destination-files-and-the-schema)
  - [Making a mapping file](#making-a-mapping-file)
    - [Entities in the mapping file](#entities-in-the-mapping-file)
    - [Properties on entities](#properties-on-entities)
    - [Using inputs and transformers](#using-inputs-and-transformers)
    - [Special properties](#special-properties)
    - [Example mapping](#example-mapping)
  - [Revising entities](#revising-entities)
- [Putting your work in the API](#putting-your-work-in-the-api)
- [List of transformers](#list-of-transformers)
  - [Bumblebee transformers](#bumblebee-transformers)
    - [copy](#copy)
    - [explicit_null](#explicit_null)
    - [format](#format)
    - [format_utc](#format_utc)
    - [generate_id](#generate_id)
    - [getSiblingProperty](#getSiblingProperty)
    - [join](#join)
    - [literal](#literal)
    - [parse_date](#parse_date)
    - [returnPropertyFromObject](#returnPropertyFromObject)
    - [split](#split)
    - [subtract](#subtract)
    - [takeItemFromArray](#takeItemFromArray)
  - [TNL transformers](#tnl-transformers)
    - [formatDateForTNL](#formatDateForTNL)
    - [getAllDatesDutch](#getAllDatesDutch)
    - [getCompanyName](#getCompanyName)
    - [getCompanyPlace](#getCompanyPlace)
    - [getPositionAndCompany](#getPositionAndCompany)
    - [getRelation](#getRelation)
    - [lookupCompanyInTNL](#lookupCompanyInTNL)
    - [match_organisation](#match_organisation)
    - [parseFunction](#parseFunction)
- [Extending this project](#extending-this-project)
  - [Creating transformers](#creating-transformers)


## Installation

### Installing git
Git is an open source version control program. It is used to download software and patches from private and public **code repositories** and to contribute as well. Installation instructions for git can be found [here](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git).

### Installing nodejs
NodeJS is an open source javascript engine with which you can create or run applications. Besides the **node** program it also installs **npm**, short for *node package manager*, which is used to install any *dependencies* a program has.
NodeJS can be downloaded and installed [here](https://nodejs.org/).

### Installing transformer
Transformer is the project you are currently looking at. If you're on github, which you probably are, you will see a textbox containing the text `https://github.com/transparantnederland/transformer.git`. If it reads `git@github.com:transparantnederland/transformer` click the dropdown on its left and select `https`. Now copy the text, go to your command line or terminal, go to a folder where you'd like to install the transformer and do  `git clone <paste repository url here>`. After you've supplied your github username and password git will have downloaded the repository and it's almost ready to run, we only need to install its dependencies. To do so, type `npm install` and npm will look in the `package.json` file which dependencies need to be installed and install those.
When it finishes you will see a tree of all the dependencies installed. Now you can run transformer by typing `npm start`. It will tell you about stuff it's loaded, but to see the application go to `localhost:3003` in your browser.

## Converting your file

### Understanding input/output formats

#### Your source file
For this transformer to work upon your file, you need to have a `.csv` file, and it needs to have a header row where the labels for each column are declared. Let's assume you have the following csv file:

nr|last update|first name|last name|company      
--|-----------|----------|----------|--------------
 1|22/5/2012  |Esmaraldo |Verjansen |Wiebertjes BV
 2|25/12/2014 |Phemke    |Mekkert   |Rosborstels NV
 3|01/01/2015 |Xantippo  |Hoekschtra|Klimkloppers
 4|20/12/2015 |Samuwel   |Akkermam  |
 
In each of these rows a person is described, as is the company where they worked.

#### Your destination files and the schema

##### Destination files
Transformer creates files to be used in [transparantnederland API](https://api.transparantnederland.nl). For `datasets` to be compatible with the API, they need to be split up into three files (two of which are made with this program):
 - datasetname.pits.ndjson
 - datasetname.relations.ndjson
 - datasetname.json

Don't worry about how to write ndjson files, or json files for that matter, the first is taken care of by transformer, the second is a responsibility of the api administrator.
 For now all you need to know is that the .pits. file has every PIT that comes out of your csv, which means every person or organization. The .relations. file has, surprisingly, all the relations between these PITs.

##### The schema
The API uses a schema for both files to check what it's importing. They can be found [here for pits](http://transparantnederland.nl:3001/schemas/pits) and [here for relations](http://transparantnederland.nl:3001/schemas/relations). Based upon these, the transformer has it [own internal schema](../blob/master/schemas/tnl_schema.yaml). Any converted object that does not validate against the schema is sent to the user for revising.
When converting your file you don't need to make any changes to this schema, however it is useful to know which properties it requires on which kind of objects.

### Making a mapping file
The mapping file describes which entities are extracted from every row of the csv file. It is divided into entities and properties, and is stored as a [YAML](https://en.wikipedia.org/wiki/YAML) file. If you name it the same as your csv file, it will be automatically selected when you start transforming.

#### Entities in the mapping file
Entities are the *primary citizens* of the mapping file. They are the highest level, and are represented as list items. Their names either correspond to names of entities in the schema file, or, when you have multiple entities of the same type in your mapping and each has a unique name, they have a property `bb_entityType: <entitytype>` so the validator knows which schema entity to validate against. Having unique names enables you to reference one entities' properties in their sibling entities.

#### Properties on entities
Every entity contains a series of *properties*. Most of these are what needs to be on them for their validation to succeed, some are *reserved properties* which I'll come to in a bit. Let's take the schema for guidance. According to the schema, a tnl.person entity needs to have a **name**, an **id**, and a **type** and it *may* have a **validSince** and **validUntil** property, as well as a **data** property for storing any additional data that doesn't fit in the previous properties.

#### Using inputs and transformers
`input` is how you declare which csv colomn to get data from. You can use one input, or multiple, for instance if you want to combine first and last name and they are in different fields. `transformer` defines which transformer functions to use and in what order. If it's the first in the chain, it uses the input value(s), otherwise what is returned from the previous transformer.
There are quite a lot of these, and they are explained [in their own section](#transformers).

#### Special properties
Some property names are reserved to be used by the program:

- `bb_entityType: 'tnl.person'`
  - tells the transformer which schema entity to validate with.
- `bb_subProperty: true`
  - must be set for the data property, which contains additional properties (see example below).
- `bb_order`: define a custom weight for your property, changes position in interface.
- `bb_description`: include this inside your property so users in the revising interface can see this description when editing this property.
- `bb_skipCondition`: allows skipping over certain values when they are encountered. It needs the following sub-properties to work:
  - `input`: which input to check for the skipcondition.
  - `value`: a list of values that are skipped, Does not need `regex`.
  - `regex`: a string which creates a regular expression, that when it matches the input, causes the row to be skipped. Does not need `value`.
- `bb_splitCondition`: some csv fields have multiple values inside of them, often delimited with another character than is used as the general delimiter. When a splitcondition is triggered a record gets split up into two or more similar records which then get processed separately. It has the following subproperties:
  - `input`: which input to check for the skipcondition.
  - `value`: looks for a specific value and splits into the values given by newValues. Doesn't need `regex` property.
  - `newValues`: a list of values that `value` gets split into.
  - `regex`: a regular expression, which if it matches the input splits it up where it is found. Doesn't need `value`/`newValues` property.

#### Example mapping
Now we will create a mapping, used to extract 3 entities from every csv row.
You can use this for reference, or structure your csv accordingly and use it for real.

```yaml
- person
    bb_entityType: 'tnl.person'
    id:
      transformer:
        - generate_id
    name:
      input:
        - first name
        - last name
      transformer:
        - format({last name}, {first name})
    type:
      transformer:
        - literal(tnl:Person)
    data:
      bb_subProperty: true
      originalID:
        input:
          - nr

- organization
    bb_entityType: 'tnl.organization
    id:
      transformer:
        - generate_id
    name:
      input:
        - company
    type:
      transformer:
        - literal(tnl:Organization)

- relation
    bb_entityType: 'tnl.relation
    id:
      transformer:
        - generate_id
    from:
      transformer:
        - getSiblingProperty(person.id)
    to:
      transformer:
        - getSiblingProperty(organization.id)
    type:
      transformer:
        - literal(tnl:employee)
```
### Revising entities
When you run the transfromer program, go to localhost:3003 and you will see a list of available datafiles. Click the one you want, choose the mapping you want, and if all entries of your sourcefile can be converted and validated you will be presented with the output. Otherwise all invalid entries will be prompted to you for revising,
to do so edit the values until the items on the right are all green or yellow and the approve button becomes available. If you think the current line is an artifact or otherwise unusable, click *reject*. When you have processed all revisions the output will be available for download or viewing. It will be stored in `output/`.

## Putting your work in the API
Currently there is no automated strategy to put your files in the API, so for now please email the .ndjson files to Tom and he will add them to the API

# List of transformers

## Bumblebee transformers

### copy
Copies input value as output value. Is going to be deprecated

### explicit_null
returns `null` value. For when you want to return something that is nothing.

### format
used for making pretty strings, for example, when this transformer receives an object containing `company` and `name`, you can call it from the mapping yaml like this: `format({name} was working at {company}.)`.

### format_utc
when passed a date, this will return it in the format `yyyy-mm-ddThh:mm:ss.mss`

### generate_id
uses the [shortId](https://www.npmjs.com/package/shortid) module to create short id strings.

### getSiblingProperty
is used to copy a value from a sibling element.
For instance, when you have a sibling called `tnl.organization`, and you want to copy that siblings' id property (as is common for relationship entities), you declare `getSiblingsProperty(tnl\.organization.id)` (note the escaped dot`\.` in there, if it weren't escaped it would look for the `organization` property of a sibling called `tnl`, which doesn't exist. To get the `foo` prop from sibling `bar`, declare `getSiblingProperty(bar.foo)`. *You can only get properties from siblings that are declared above the current entity in the mapping yaml.*

### join
join, like join in regular javascript, joins an array to a string with an optional parameter. When this transformer gets data `[1,2,3]`, declaring it `join` returns `1,2,3`. Declaring `join( )` renders `1 2 3`, `join()` => `123`, `join( and )` results in `1 and 2 and 3`.

### literal
duplicate of [join](#join)

### parse_date
parses input data as a date, results in a date or an error if it couldn't be parsed.

### returnPropertyFromObject
is used when the previous transformer returns an object like `{foo: 'bar'}`, then declare `returnPropertyFromObject(foo)` to get `'bar'`.

### split
split is the opposite of [join](#join), and will split up a string on commas or another string you can provide. `split( )` will split on spaces, `split()` will split on every character. Just `split` will split on commas. Returns array.

### subtract
subtract will subtract two operands from one another.
When it is passed an object like `{a: 2, b: 3}` you can declare `subtract(b,a)` and the result will be `1`.

### takeItemFromArray
Passes *n*th item from array.
When this transformer is passed an array, for instance `['alpha','beta','gamma']`, declaring `takeItemFromArray(0)` returns `'alpha'`. `takeItemFromArray(1)` or `takeItemFromArray(-2)` return `'beta'` and `takeItemFromArray(-1)` returns `'gamma'`.

## TNL Transformers

### formatDateForTNL
right now this just passes its input, like `copy` or `literal`. Still needs some work probably

### getAllDatesDutch
looks in the input string for any dates in Dutch, will pass them all as array

### getCompanyName
looks for known companynames in string, then either returns `{company: result}` or error

### getCompanyPlace
returns the part of the string that is preceded with ` te `.

### getPositionAndCompany
looks for jobtitles in the string and passes `{jobTitle: result, company: everything after result}`

### getRelation
looks for known jobtitles and returns a tnl:relation type

### lookupCompanyInTNL
Unfinished. Should lookup company name on server with string supplied

### match_organization
Unused. Converts between short and long notations of names

### parseFunction
The most comprehensive of all parsers, this one is a collection of small parsers that try to parse dutch function descriptions. See [the file](transformers/parseFunction.js) for more info.

# Extending this project

## Creating transformers
If you want to add your own transformers, create an empty `.js` file in the transformers directory. Declare `module.exports.transform = function( context, data [, argument, callback]){ /* your logic goes here */ };`

`context` contains all data in the current csv line, what kind of entity we're currently building and what input is used for where our current data comes from. Also, you can mark the current entity as invalid (and thus force the user to review it) by setting `context.markNextAsInvalid = true`.

`data` the input data that is given to the transformer

`argument` string value of anything between the braces where your transformer gets declared to be used in the mapping file.

`callback` for when you have an asynchronous transformer that needs to wait for a remote or i/o operation. Every transformer gets passed a callback, but the program only waits for it to be executed when the transformer returns `undefined`.
