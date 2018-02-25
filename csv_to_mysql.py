import csv
import pymysql


def convertString(values, key):
    return values[key].replace('"','\\"') if values[key] is not None else ''


mydb = pymysql.connect(host='artmeetsemoji-cluster.cluster-cf2nstf005qs.eu-west-1.rds.amazonaws.com',
    user='root',
    passwd='exampleexample',
    db='art_meets_emoji',
    charset='utf8')
cursor = mydb.cursor()
mydb.query('delete from new_import2');
#restval='',delimiter=',',doublequote=False,strict=True,
reader = csv.DictReader(open('SMK.csv','r',encoding='utf8'),doublequote=True,skipinitialspace=True)

startQuery = '''INSERT INTO new_import2 (`medium_image_url`, `id`, `artist_auth`, `artist_name`, `artist_name_text`, `artist_natio_dk`, `category`, `comments`, `content_notes`,
`description_note_dk`, `materiale_type`, `materiale_type_eng`, `multi_work_ref`, `note_elementer`, `proveniens`, `related_id`, `title_all`, `title_dk`, `title_eng`,`creation_dk`) VALUES '''

insertQuery = ''

i = 0
for row in reader:
    #print(row)
    insertQuery = insertQuery + '''("%s", "%s", "%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s"),''' % (
          convertString(row, 'medium_image_url'),
          convertString(row, 'id'),
          convertString(row, 'artist_auth'),
          convertString(row, 'artist_name'),
          convertString(row, 'artist_name_text'),
          convertString(row, 'artist_natio_dk'),
          convertString(row, 'category'),
          convertString(row, 'comments'),
          convertString(row, 'content_notes'),
          convertString(row, 'description_note_dk'),
          convertString(row, 'materiale_type'),
          convertString(row, 'materiale_type_en'),
          convertString(row, 'multi_work_ref'),
          convertString(row, 'note_elementer'),
          convertString(row, 'proveniens'),
          convertString(row, 'related_id'),
          convertString(row, 'title_all'),
          convertString(row, 'title_dk'),
          convertString(row, 'title_eng'),
          convertString(row, 'object_production_date_text_dk')
         )
    #print(query)

    i = i+1
    if i%250 == 0:
        print('committing')
        #print(query)
        #sys.exit(0)
        try:
            cursor.execute(startQuery + insertQuery[:-1])
            mydb.commit();
        except Exception as e:
            print(e);

        insertQuery = ''

cursor.execute(startQuery + insertQuery[:-1])
mydb.commit()
print("added %d rows" % i)
#close the connection to the database.
cursor.close()
print ("Done")
