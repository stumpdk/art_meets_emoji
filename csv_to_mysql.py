import csv
import pymysql

mydb = pymysql.connect(host='artmeetsemoji-cluster.cluster-cf2nstf005qs.eu-west-1.rds.amazonaws.com',
    user='root',
    passwd='exampleexample',
    db='art_meets_emoji')
cursor = mydb.cursor()


reader = csv.DictReader(open('SMK.csv','r'),restval='',delimiter=',',doublequote=False,strict=True,skipinitialspace=True)
i = 0
for row in reader:
    print(row)
    cursor.execute('''
      INSERT INTO new_import( 
      `medium_image_url`, `id`, `artist_auth`, `artist_name`, `artist_name_text`, `artist_natio_dk`, `category`, `comments`, `content_notes`, 
      `description_note_dk`, `materiale_type`, `materiale_type_eng`, `multi_work_ref`, `note_elementer`, `proveniens`, `related_id`, `title_all`, `title_dk`, `title_eng`) 
      VALUES(
        "%s", "%s", "%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s"
        )
        '''
         % (
          row['medium_image_url'],
          row['id'].replace('"','\\"'),
          row['artist_auth'].replace('"','\\"'),
          row['artist_name'].replace('"','\\"'),
          row['artist_name_text'].replace('"','\\"'),
          row['artist_natio_dk'].replace('"','\\"'),
          row['category'].replace('"','\\"'),
          row['comments'].replace('"','\\"'),
          row['content_notes'].replace('"','\\"'),
          row['description_note_dk'].replace('"','\\"'),
          row['materiale_type'].replace('"','\\"'),
          row['materiale_type_en'].replace('"','\\"'),
          row['multi_work_ref'].replace('"','\\"'),
          row['note_elementer'].replace('"','\\"'),
          row['proveniens'].replace('"','\\"'),
          row['related_id'].replace('"','\\"'),
          row['title_all'].replace('"','\\"'),
          row['title_dk'].replace('"','\\"'),
          row['title_eng'].replace('"','\\"')
         ))
    i = i+1
    if i%500 == 0:
        print('committing')
        mydb.commit()

mydb.commit()

#close the connection to the database.
cursor.close()
print ("Done")
